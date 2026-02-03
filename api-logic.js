document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-btn');

    submitBtn.onclick = async function (e) {
        e.preventDefault(); 

        const loader = document.getElementById('loader');
        const resultArea = document.getElementById('result-area');

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

        loader.style.display = 'flex';
        resultArea.style.display = 'none'; 

        try {

            const response = await fetch('http://127.0.0.1:8000/get_plan', {
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


            loader.style.display = 'none';
            resultArea.style.display = 'block';


            document.getElementById('res-kcal').innerText = data.macros_and_cals.kalories;
            document.getElementById('res-p').innerText = data.macros_and_cals.proteins + 'г';
            document.getElementById('res-f').innerText = data.macros_and_cals.fats + 'г';
            document.getElementById('res-c').innerText = data.macros_and_cals.carbs + 'г';


            const chartImg = document.getElementById('diet-chart');
            chartImg.src = "data:image/png;base64," + data.chart_img;

            document.getElementById('chart-placeholder').style.display = 'none';


            const mealsContainer = document.getElementById('diet-result');
            mealsContainer.innerHTML = '';

            data.meals.forEach(meal => {
                const mealHTML = `
                    <div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <h4 style="color: var(--accent); margin-bottom: 5px;">${meal.name}</h4>
                        <div style="font-size: 0.9em; margin-bottom: 8px;">
                            🔥 ${meal.macros_and_cals.kalories} ккал | 
                            Б: ${meal.macros_and_cals.proteins} | 
                            Ж: ${meal.macros_and_cals.fats} | 
                            В: ${meal.macros_and_cals.carbs}
                        </div>
                        <ul style="padding-left: 20px;">
                            ${meal.dishes.map(dish => `<li>${dish}</li>`).join('')}
                        </ul>
                    </div>
                `;
                mealsContainer.innerHTML += mealHTML;
            });

            if (data.note) {
                const noteHTML = `
                    <div style="margin-top: 25px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; border-left: 3px solid #ff7e5f; font-size: 0.95em; line-height: 1.5;">
                        <strong style="display:block; margin-bottom: 5px; color: #ff7e5f;">💡 Корисна порада:</strong>
                        ${data.note}
                    </div>
                `;
                mealsContainer.innerHTML += noteHTML;
            }

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