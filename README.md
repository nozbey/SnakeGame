# 🐍 AI-Powered Snake Game

This project is a collection of **Snake Game** versions created by **DeepSeek**, **ChatGPT**, and **Claude 3.7**. Each version was developed using the same initial prompt and runs on a Node.js-based Express server. The project can be easily deployed on the **Render** platform using **Docker**. 🚀

🎮 **Gameplay: Claude**
![Claude Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/claude.gif)


🎮 **Gameplay: ChatGPT**
![ChatGPT Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/chatgpt.gif)


🎮 **Gameplay: DeepSeek**
![DeepSeek Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/deepseek.gif)

## 📑 Table of Contents
- [Game Mechanics](#-game-mechanics)
- [Directory Structure](#-directory-structure)
- [Usage](#-usage)
    - [Local Execution](#-local-execution)
    - [Running with Docker](#-running-with-docker)
- [Deployment on Render](#-deployment-on-render)
- [Notes](#-notes)
- [License](#-license)

## 🎮 Game Mechanics

- The game is played on a grid, and your goal is to eat as many apples as possible without crashing into other snakes or walls.
- Snakes move automatically and the game is played in real-time.
- The game ends when a snake crashes into another snake.
- Each user controls their own snake.
- Users try to eat randomly generated food.
- Snakes are not allowed to crash into each other. The player who crashes leaves the game and restarts, while the crashed snake continues.
- Snakes can pass through walls, and the game continues even if one player fails. Only the failed player’s game ends.
- Pressing the same direction key while moving speeds up the snake.
- When another snake crashes, the crashed snake gains extra points.
- When normal food is eaten, the snake grows and slows down. The game automatically restarts with the same name when it ends.
- Red food appears 15% of the time. If eaten and the snake's length is greater than 3, the snake's length decreases by 3.
- Blue food appears 3% of the time. If eaten, the snake stops moving for 5 seconds.
- Purple food appears 2% of the time. If eaten, the snake splits into two and its speed is halved.
- A scoreboard is added to the game, and the game is won when 1000 points are reached. The winner is announced to everyone, and the game restarts after 10 seconds.
- Pressing the same direction key while moving doubles the snake's speed for 2 seconds.

## 📂 Directory Structure

```
/snake-game/
│── deepseek-version/      # Version created by DeepSeek
│   ├── server.js          # Express-based Node.js server file
│   ├── package.json       # Node.js dependencies and scripts
│   ├── public/            # Frontend containing HTML, CSS, and JS files
│   │   ├── index.html     # Main HTML file of the game
│   ├── Dockerfile         # Configuration file for Docker
│
│── chatgpt-version/       # Version created by ChatGPT
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   ├── Dockerfile
│
│── claude-version/        # Version created by Claude 3.7
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   ├── Dockerfile
│
│── README.md              # This document 😃
```

## 🎮 Usage

### 🔹 **Local Execution**

1. **Ensure Node.js and npm are installed.**
2. Choose the desired version and navigate to the corresponding directory in the terminal. For example:
     ```sh
     cd deepseek-version
     ```
3. Install dependencies:
     ```sh
     npm install express socket.io
     ```
4. Start the server:
     ```sh
     node server.js
     ```
5. Open the following address in your browser:
     ```
     http://localhost:3000
     ```

### 🐳 **Running with Docker**

1. Ensure Docker is installed.
2. Open the terminal and navigate to the relevant directory:
     ```sh
     cd deepseek-version
     ```
3. Build the Docker image:
     ```sh
     docker build -t snake-game-deepseek .
     ```
4. Run the container:
     ```sh
     docker run -p 8000:8000 snake-game-deepseek
     ```
5. Open the game in your browser:
     ```
     http://localhost:8000
     ```

## 🌍 Deployment on Render

Each version can be deployed as a separate Web Service on **Render**.

1. Log in to **[Render](https://render.com/)** and connect your GitHub repository.
2. Click on "New Web Service".
3. Select `main` or `master` as the branch.
4. Choose **Docker** as the deployment method.
5. Enter the path to the relevant Dockerfile:
     - `deepseek-version/Dockerfile`
     - `chatgpt-version/Dockerfile`
     - `claude-version/Dockerfile`
6. Complete the deployment process by clicking the deploy button.

You can run your game from the links provided by Render for each service. Example:
- 🎮 **DeepSeek Version:** `https://deepseek-snake.onrender.com`
- 🎮 **ChatGPT Version:** `https://chatgpt-snake.onrender.com`
- 🎮 **Claude Version:** `https://claude-snake.onrender.com`

## 📌 Notes
- **Each version was developed using the same prompt, but the game mechanics may vary due to differences in AI models.**
- **You can submit pull requests to improve the project and add new features.**
- **The games run using Node.js and Express. If you want to use a different backend framework, you can easily modify the code.**

🚀 Have fun! 🕹️

## 📜 License
![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).
