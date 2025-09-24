FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install flask
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:5000/ || exit 1
CMD ["python3", "app.py"]
