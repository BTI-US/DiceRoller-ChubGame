# DiceRollerSimulator-Three

[![Deploy static content to Pages](https://github.com/BTI-US/DiceRollerSimulator-ThreeJS/actions/workflows/static.yml/badge.svg?branch=main)](https://github.com/BTI-US/DiceRollerSimulator-ThreeJS/actions/workflows/static.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

- Last Modified: 2025-01-05
- Author: Phill Weston

![screenshot](images/diceRollerSimulator0.jpg)

A 3D dice simulator built on Three.js, utilizing Cannon.js as the physics engine, allowing users to control the number of the dices.

Now you can find a live version at [here](https://dice,chubgame.com/).

## Features

- Built with Vite and Three.js: Ensures fast development and smooth performance for an immersive experience.
- Cannon.js Physics Engine: Provides realistic scene simulations for accurate dice interactions.
- Advanced Lighting and Shadow System: Creates beautifully rendered scenes with dynamic lighting effects.
- Variable Dice Quantity: Allows users to customize the number of dice, catering to diverse gameplay needs.
- Randomized Initial Dice Positioning: Enhances realism by randomizing starting positions, resulting in more authentic outcomes.
- Display Dice Roll Results: Shows the sum of the dice roll results, providing users with instant feedback.

## Installation

### Clone the repository

```shell
git clone https://github.com/BTI-US/DiceRollerSimulator-ThreeJS.git
```

### Install packages

```shell
npm i
```

### Start the app

```shell
npm run dev
```

## Environment Variables

|Variable Name|Description|Default Value|
|-|-|-|
|`VITE_VALIDATE_PROMOTION_CODE_API`|API endpoint to validate promotion code|`https://chubgame.com/wp-json/chubgame/v1/validate`|
|`VITE_SEND_DICE_DATA_API`|API endpoint to send dice data|`https://chubgame.com/wp-json/chubgame/v1/send`|
|`VITE_MAX_DICE_AMOUNT`|Maximum number of dice allowed|`10`|

## WordPress API Endpoints

### Validate Promotion Code

This endpoint validates the promotion code provided by the user.

**Endpoint:**

```text
POST /wp-json/dice-roller/v1/validate
```

**Request Body:**

```json
{
    "promotionCode": "string",
    "username": "string"
}
```

**Response:**

- **200 OK**: If the promotion code is valid.

  ```json
  {
      "valid": true
  }
  ```

- **400 Bad Request**: If the promotion code is invalid.

  ```json
  {
      "valid": false,
      "error": "Invalid promotion code"
  }
  ```

### Send Dice Data

This endpoint sends the dice data to the backend.

**Endpoint:**

```text
POST /wp-json/dice-roller/v1/send
```

**Request Body:**

```json
{
    "diceAmount": "integer",
    "totalPoints": "integer",
    "promotionCode": "string",
    "isPromotionUser": "boolean",
    "username": "string",
    "chips": "integer"
}
```

**Response:**

- **200 OK**: If the data is successfully processed.

  ```json
  {
      "success": true
  }
  ```

- **400 Bad Request**: If there is an error processing the data.

  ```json
  {
      "error": "Error message"
  }
  ```

## Milestone

- [x] Basic 3D dice simulator
- [x] Send the current dice number to the server using HTTP POST
- [x] Add the promotion code feature
- [x] Add the chip amount feature

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
