import {useState} from "react";
import {createDices} from "./3d.js";


const App = () => {

    const [diceAmount, setDiceAmount] = useState(6);

    const handleClickAdd = () => {
        setDiceAmount(d => d+1);
    }

    const handleClickSubtract = () => {
        setDiceAmount(d => d===1?d:d-1);
    }

    const handleClickRoll = () => {
        createDices(diceAmount);
    }

    return (
        <div className="font-['Cherry_Bomb_One',system-ui] select-none">

            <div className="fixed top-3 left-3 text-[36px]">
                <p>DICE</p>
                <p>3D</p>
            </div>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-[#0000009a]">
                <p className="text-[18px]">AMOUNT: {diceAmount}</p>
                <div className="text-[64px] cursor-pointer flex items-center gap-4">
                    <button type="button" onClick={handleClickSubtract} className="duration-300 active:scale-125">-</button>
                    <button type="button" onClick={handleClickRoll} className="duration-300 active:scale-125"> ROLL </button>
                    <button type="button" onClick={handleClickAdd} className="duration-300 active:scale-125">+</button>
                </div>
            </div>
        </div>
    )
}

export default App;