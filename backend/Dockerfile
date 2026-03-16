FROM python:3.12 as builder
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true
RUN poetry install --no-root

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/.venv .venv/
COPY . .
RUN apt-get update -y && apt-get install libpq5 -y && apt-get clean

ENV PATH="/app/.venv/bin:$PATH"
ENV DATABASE_URL="sqlite+aiosqlite:///data/app.db"

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
