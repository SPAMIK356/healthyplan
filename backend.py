from fastapi import FastAPI
from contextlib import asynccontextmanager
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from os import getenv

@asynccontextmanager
async def lifespan(app: FastAPI):

    load_dotenv()

    global client
    global usedModel
    model = getenv("MODEL")

    if model == None:
        raise Exception("Модель не вказана! Додайте назву моделі в файл .env під назвою 'MODEL'!")

    usedModel = str(model)
    client = genai.Client()
    

    yield



app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


class UserParams(BaseModel):
    weight: float = Field(description="Вага користувача в кілограмах")
    age : int = Field(description="Вік користувача в роках (ціле число)")
    height : int = Field(description="Зріст користувача (в сантиметрах)")
    sex : str = Field(description="Стать користувача")
    goal : str = Field(description="Мета користувача")


class Macros(BaseModel):
    kalories : float = Field(description="Кількість калорій")
    proteins : float = Field(description="Кількість білків")
    fats : float = Field(description="Кількість жирів")
    carbs : float = Field(description="Кількість вуглеводів")

class Meal(BaseModel):
    macros_and_cals : Macros = Field(description="Сумарна кількість поживних речовин та калорій на цей прийом їжі")
    dishes : list[str] = Field(description="Страви для цього прийому їжі")
    name : str = Field(description="Назва прийому їжі (наприклад, сніданок, вечеря, перекус і т.д.)")

class Plan(BaseModel):
    meals : list[Meal] = Field(description="Список прийомів їжі на цей день")
    macros_and_cals : Macros = Field(description="Сумарна калорійність та поживна цінність всіх вказаних прийомів їжі")
    note : str = Field(description="Додаткова інформація (1-3 речення)")

@app.post('/get_plan')
async def get_plan(userParams : UserParams) -> Plan:
    """# Генерує план прийому їжі
    
    На основі переданих даних генерує детальний план прийому їжі на день.
    
    Повертає об'єкт **Plan**."""
    prompt = ("Згенеруй план прийому їжі на день, враховуючи КБЖВ, для користувача з наступними даними:\n" 
              f"Стать: {userParams.sex}\n"
               f"Вік: {userParams.age}\n"
               f"Зріст: {userParams.height}\n"
               f"Вага: {userParams.weight}\n"
               f"Мета: {userParams.goal}")
    response = await client.aio.models.generate_content(
                                                        model=usedModel,contents=prompt,
                                                        
                                                        config={"response_mime_type": "application/json",
                                                                "response_schema": Plan,
                                                                }
                                                        )
    
    result = Plan.model_validate_json(str(response.text))

    return result