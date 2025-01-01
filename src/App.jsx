import { useState } from 'react';
import { createDices } from './3d.js';

const App = () => {
    const [diceAmount, setDiceAmount] = useState(6);
    const [totalPoints, setTotalPoints] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const handleClickAdd = () => {
        setDiceAmount((d) => d + 1);
    };

    const handleClickSubtract = () => {
        setDiceAmount((d) => (d === 1 ? d : d - 1));
    };

    const handleClickRoll = async () => {
        try {
            const points = await createDices(diceAmount);
            console.log('createDices returned:', points);
            if (points && Array.isArray(points)) {
                const total = points.reduce((acc, point) => acc + point, 0);
                setTotalPoints(total);
                setShowPopup(true);
            } else {
                console.error('createDices did not return an array of points');
            }
        } catch (error) {
            console.error('Error in createDices:', error);
        }
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div className="font-['Cherry_Bomb_One',system-ui] select-none">
            <div className="fixed top-3 left-3 text-[36px]">
                <p>DICE</p>
                <p>3D</p>
            </div>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-[#0000009a]">
                <p className="text-[18px] relative">AMOUNT: {diceAmount}</p>
                <div className="text-[64px] cursor-pointer flex items-center gap-4">
                    <button type="button" onClick={handleClickSubtract} className="duration-300 active:scale-125">
                        -
                    </button>
                    <button type="button" onClick={handleClickRoll} className="duration-300 active:scale-125">
                        ROLL
                    </button>
                    <button type="button" onClick={handleClickAdd} className="duration-300 active:scale-125">
                        +
                    </button>
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <p className="text-xl">Total Points: {totalPoints}</p>
                        <button onClick={closePopup} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
