import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="Matchory",
    user="postgres",
    password="123456"
)

cur = conn.cursor()