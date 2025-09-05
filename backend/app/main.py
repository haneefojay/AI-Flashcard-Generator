from fastapi import FastAPI
from .routers import flashcard
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

'''
origins = [
    "http://localhost:3000",
]
'''

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def root():
    return {"status": "healthy"}

app.include_router(flashcard.router)