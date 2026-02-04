document.addEventListener('DOMContentLoaded', () => {
    // 0. НАЛАШТУВАННЯ СЕРВЕРА (FAILOVER)

    const LOCAL_API = 'http://127.0.0.1:8000'; 
    const REMOTE_API = 'http://46.224.54.26:2500'; 
    let currentApiUrl = REMOTE_API; 

    async function selectServer() {
        console.log('Перевіряємо локальний сервер...');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);

            const response = await fetch(`${LOCAL_API}/health`, { 
                method: 'GET', 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                console.log('✅ Localhost знайдено!');
                currentApiUrl = LOCAL_API;
            }
        } catch (error) {
            console.log('☁️ Localhost недоступний, використовуємо віддалений сервер.');
            currentApiUrl = REMOTE_API;
        }
    }
    selectServer();

    const submitBtn = document.getElementById('submit-btn');

    submitBtn.onclick = async function (e) {
        e.preventDefault(); 

        const loader = document.getElementById('loader');
        const resultArea = document.getElementById('result-area');

        // Збираємо дані з форми
        const age = parseInt(document.getElementById('age').value);
        const height = parseInt(document.getElementById('height').value);
        const weight = parseInt(document.getElementById('weight').value);
        const gender = document.querySelector('input[name="gender"]:checked').value;

        let goal = document.getElementById('goal').value;
        if (goal === 'other') {
            goal = document.getElementById('goal-other').value || "Збалансоване харчування";
        }

        const requestData = {
            weight: weight,
            height: height,
            age: age,
            sex: gender === 'male' ? 'Чоловік' : 'Жінка',
            goal: goal
        };

        // Показуємо лоадер та ховаємо стару область результатів
        loader.style.display = 'flex';
        resultArea.style.display = 'none'; 

        try {
            const response = await fetch(`${currentApiUrl}/get_plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Помилка сервера');
            }

            const data = await response.json(); 

            // Приховуємо лоадер та показуємо результати
            loader.style.display = 'none';
            resultArea.style.display = 'block';

            // 1. Оновлюємо КБЖВ
            document.getElementById('res-kcal').innerText = data.macros_and_cals.kalories;
            document.getElementById('res-p').innerText = data.macros_and_cals.proteins + 'г';
            document.getElementById('res-f').innerText = data.macros_and_cals.fats + 'г';
            document.getElementById('res-c').innerText = data.macros_and_cals.carbs + 'г';

            // 2. Оновлюємо діаграму
            const chartImg = document.getElementById('diet-chart');
            chartImg.src = "data:image/png;base64," + data.chart_img;
            document.getElementById('chart-placeholder').style.display = 'none';

            // 3. Генеруємо меню (картки для сітки 2х2)
            const mealsContainer = document.getElementById('diet-result');
            mealsContainer.innerHTML = ''; // Очищуємо старий контент

            data.meals.forEach(meal => {
                const mealHTML = `
                    <div class="meal-card">
                        <h4>${meal.name}</h4>
                        <div class="meal-stats" style="font-size: 0.85em; opacity: 0.8; margin-bottom: 10px;">
                            🔥 ${meal.macros_and_cals.kalories} ккал | 
                            Б: ${meal.macros_and_cals.proteins}г | 
                            Ж: ${meal.macros_and_cals.fats}г | 
                            В: ${meal.macros_and_cals.carbs}г
                        </div>
                        <ul style="padding-left: 18px; margin: 0; font-size: 0.9em;">
                            ${meal.dishes.map(dish => `<li>${dish}</li>`).join('')}
                        </ul>
                    </div>
                `;
                mealsContainer.innerHTML += mealHTML;
            });

            // 4. Виводимо пораду в окремий блок (id="ai-tip")
            const tipElement = document.getElementById('ai-tip');
            if (data.note && tipElement) {
                tipElement.innerText = data.note;
            }

            // 5. Плавний скрол до результатів
            setTimeout(() => {
                const headerHeight = document.querySelector('.glass-header').offsetHeight;
                const elementPosition = resultArea.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 50);

        } catch (error) {
            console.error(error);
            loader.style.display = 'none';
            alert('Сталася помилка при генерації. Перевірте консоль або запустіть сервер.');
        }
    };
});