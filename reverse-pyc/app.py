from flask import Flask, request, render_template_string
from secret_check import check_password

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        password = request.form.get('password')
        if check_password(password):
            result = "Congratulations! You found the flag."
        else:
            result = "Incorrect password."
        return render_template_string('''
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>Reverse PYC Challenge</title>
                <style>
                    body {
                        background-color: #0e0e0e;
                        color: #f0f0f0;
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 960px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    header {
                        background-color: #111;
                        padding: 10px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        color: #00ffff;
                        box-shadow: 0 0 10px #00ffff;
                    }
                    header h1 {
                        margin: 0;
                        font-size: 1.8rem;
                        text-shadow: 0 0 8px #00ffff;
                    }
                    nav a {
                        color: #00ffff;
                        margin-left: 20px;
                        text-decoration: none;
                        font-weight: bold;
                        transition: color 0.3s ease;
                    }
                    nav a:hover {
                        color: #ff6f61;
                        text-decoration: underline;
                    }
                    .challenge-card {
                        background-color: #1a1a1a;
                        border-radius: 12px;
                        padding: 15px 20px;
                        margin-bottom: 15px;
                        box-shadow: 0 0 10px #00ffff;
                    }
                    .challenge-card h3 {
                        margin: 0 0 10px 0;
                        color: #ff6f61;
                    }
                    .challenge-card p {
                        margin: 0;
                        font-size: 0.95rem;
                        line-height: 1.4;
                    }
                    .hint-link {
                        margin-top: 10px;
                        display: inline-block;
                        color: #00ffff;
                        text-decoration: underline;
                        cursor: pointer;
                    }
                    .hint-link:hover {
                        color: #ff6f61;
                    }
                </style>
            </head>
            <body>
                <header>
                    <h1>Reverse PYC Challenge</h1>
                    <nav>
                        <a href="/">Home</a>
                    </nav>
                </header>
                <div class="container">
                    <div class="challenge-card">
                        <h3>Enter Password</h3>
                        <p>{{ result }}</p>
                        <a href="/" class="hint-link">Try Again</a>
                    </div>
                </div>
            </body>
            </html>
        ''', result=result)
    return render_template_string('''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Reverse PYC Challenge</title>
            <style>
                body {
                    background-color: #0e0e0e;
                    color: #f0f0f0;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 960px;
                    margin: 0 auto;
                    padding: 20px;
                }
                header {
                    background-color: #111;
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #00ffff;
                    box-shadow: 0 0 10px #00ffff;
                }
                header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    text-shadow: 0 0 8px #00ffff;
                }
                nav a {
                    color: #00ffff;
                    margin-left: 20px;
                    text-decoration: none;
                    font-weight: bold;
                    transition: color 0.3s ease;
                }
                nav a:hover {
                    color: #ff6f61;
                    text-decoration: underline;
                }
                .challenge-card {
                    background-color: #1a1a1a;
                    border-radius: 12px;
                    padding: 15px 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 0 10px #00ffff;
                }
                .challenge-card h3 {
                    margin: 0 0 10px 0;
                    color: #ff6f61;
                }
                .challenge-card p {
                    margin: 0;
                    font-size: 0.95rem;
                    line-height: 1.4;
                }
                .hint-link {
                    margin-top: 10px;
                    display: inline-block;
                    color: #00ffff;
                    text-decoration: underline;
                    cursor: pointer;
                }
                .hint-link:hover {
                    color: #ff6f61;
                }
                form {
                    margin-top: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 10px;
                    color: #00ffff;
                }
                input {
                    padding: 10px;
                    border: 1px solid #00ffff;
                    border-radius: 5px;
                    background-color: #1a1a1a;
                    color: #f0f0f0;
                    width: 100%;
                    max-width: 300px;
                }
                button {
                    padding: 10px 20px;
                    background-color: #ff6f61;
                    color: #f0f0f0;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #e55a4e;
                }
            </style>
        </head>
        <body>
            <header>
                <h1>Reverse PYC Challenge</h1>
                <nav>
                    <a href="/">Home</a>
                </nav>
            </header>
            <div class="container">
                <div class="challenge-card">
                    <h3>Enter Password</h3>
                    <p>Reverse engineer the Python script to find the correct password.</p>
                    <form method="post">
                        <label for="password">Enter the password:</label>
                        <input type="password" id="password" name="password" required>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    ''')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
