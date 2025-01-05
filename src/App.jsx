/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-05 12:31:59
 * @FilePath: \DiceRollerSimulator-ThreeJS\src\App.jsx
 * @Description: 
 * 
 */
import { useState } from 'react';
import { createDices, sendDiceData } from './3d.js';

const App = () => {
    const [diceAmount, setDiceAmount] = useState(6);
    const [totalPoints, setTotalPoints] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showPromotionDialog, setShowPromotionDialog] = useState(true);
    const [promotionCode, setPromotionCode] = useState('');
    const [promotionSkipped, setPromotionSkipped] = useState(false);
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState('');

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

    const handleSkipPromotion = () => {
        setPromotionSkipped(true);
        setShowPromotionDialog(false);
    };

    const validatePromotionCode = (code) => {
        const regex = /^[a-zA-Z0-9]{16}$/;
        if (!code) {
            return 'Promotion code cannot be empty';
        }
        if (!regex.test(code)) {
            return 'Promotion code must be 16 characters long and contain only letters and numbers';
        }
        return '';
    };

    const handleSubmitPromotion = () => {
        const error = validatePromotionCode(promotionCode);
        if (error) {
            setErrorPopup(error);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setPromotionSkipped(false);
        setShowPromotionDialog(false);
    };

    const handleSave = async () => {
        try {
            await navigator.clipboard.writeText(promotionCode);
            console.log('Promotion code copied to clipboard');
            setShowClipboardPopup(true);
            setTimeout(() => setShowClipboardPopup(false), 3000); // Hide after 3 seconds
            //await sendDiceData(diceAmount, totalPoints, promotionCode, true);
        } catch (error) {
            console.error('Error saving promotion code:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            //await sendDiceData(diceAmount, totalPoints, promotionCode, false);
        } catch (error) {
            console.error('Error submitting promotion code:', error);
        }
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div className="font-['Cherry_Bomb_One',system-ui] select-none">
            {showPromotionDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Enter Promotion Code</h2>
                        <input
                            type="text"
                            value={promotionCode}
                            onChange={(e) => setPromotionCode(e.target.value)}
                            className="border p-2 mb-4 w-full"
                        />
                        <button onClick={handleSkipPromotion} className="mr-2 px-4 py-2 bg-gray-500 text-white rounded">
                            Skip
                        </button>
                        <button onClick={handleSubmitPromotion} className="px-4 py-2 bg-blue-500 text-white rounded">
                            Start
                        </button>
                    </div>
                </div>
            )}

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
                        <div className="mt-4 flex justify-center space-x-4">
                            <button onClick={closePopup} className="px-4 py-2 bg-blue-500 text-white rounded">
                                Close
                            </button>
                            {promotionSkipped ? (
                                <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded">
                                    Submit
                                </button>
                            ) : (
                                <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded">
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showClipboardPopup && (
                <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 slide-down">
                    Promotion code copied to clipboard
                </div>
            )}

            {errorPopup && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 slide-down">
                    {errorPopup}
                </div>
            )}
        </div>
    );
};

export default App;
