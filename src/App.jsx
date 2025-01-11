/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-05 14:40:19
 * @FilePath: \DiceRollerSimulator-ThreeJS\src\App.jsx
 * @Description: 
 * 
 */
import { useState, useEffect } from 'react';
import { createDices } from './3d.js';

const VALIDATE_PROMOTION_CODE_API = import.meta.env.VITE_VALIDATE_PROMOTION_CODE_API;
const SEND_DICE_DATA_API = import.meta.env.VITE_SEND_DICE_DATA_API;
const MAX_DICE_AMOUNT = parseInt(import.meta.env.VITE_MAX_DICE_AMOUNT, 10);  // Parsing as an integer

const App = () => {
    const [diceAmount, setDiceAmount] = useState(6);
    const [totalPoints, setTotalPoints] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showPromotionDialog, setShowPromotionDialog] = useState(true);
    const [promotionCode, setPromotionCode] = useState('');
    const [promotionSkipped, setPromotionSkipped] = useState(false);
    const [successPopup, setSuccessPopup] = useState('');
    const [errorPopup, setErrorPopup] = useState('');
    const [warnPopup, setWarnPopup] = useState('');
    const [infoPopup, setInfoPopup] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const usernameParam = params.get('username');
        if (usernameParam) {
            setUsername(usernameParam);
        } else {
            setWarnPopup('Please provide a username in the URL.');
            setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
        }
    }, []);

    const handleClickAdd = () => {
        if (diceAmount < MAX_DICE_AMOUNT) {
            setDiceAmount((d) => d + 1);
        } else {
            console.warn(`Maximum dice amount of ${MAX_DICE_AMOUNT} reached`);
            setWarnPopup(`Maximum dice amount of ${MAX_DICE_AMOUNT} reached`);
            setTimeout(() => setWarnPopup(''), 3000); // Hide error popup after 3 seconds
        }
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

    const sendDiceData = async (diceAmount, totalPoints, promotionCode, isPromotionUser) => {
        try {
            const response = await fetch(SEND_DICE_DATA_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diceAmount,
                    totalPoints,
                    promotionCode,
                    isPromotionUser,
                    username,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error sending data');
            }
            console.log('Response from backend:', data);
        } catch (error) {
            console.error('Error sending data to backend:', error);
            throw error;
        }
    };

    const validatePromotionCode = async (code) => {
        const regex = /^[a-zA-Z0-9]{16}$/;
        if (!code) {
            return 'Promotion code cannot be empty';
        }
        if (!regex.test(code)) {
            return 'Promotion code must be 16 characters long and contain only letters and numbers';
        }

        try {
            const response = await fetch(VALIDATE_PROMOTION_CODE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ promotionCode: code, username }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error validating promotion code');
            }
            if (!data.valid) {
                return 'Invalid promotion code';
            }
        } catch (error) {
            console.error('Error validating promotion code:', error);
            return 'Error validating promotion code';
        }
        return '';
    };

    const handleSubmitPromotion = async () => {
        const error = await validatePromotionCode(promotionCode);
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
            setSuccessPopup('Promotion code copied to clipboard');
            setTimeout(() => setSuccessPopup(''), 3000); // Hide after 3 seconds
            await sendDiceData(diceAmount, totalPoints, promotionCode, true);
            setSuccessPopup('Promotion code saved successfully');
            setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        } catch (error) {
            console.error('Error saving promotion code:', error);
            setErrorPopup('Error saving promotion code');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
        }
    };

    const handleSubmit = async () => {
        try {
            await sendDiceData(diceAmount, totalPoints, promotionCode, false);
            setSuccessPopup('Promotion code submitted successfully');
            setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        } catch (error) {
            console.error('Error submitting promotion code:', error);
            setErrorPopup('Error submitting promotion code');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
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
                <p>DICE 3D</p>
                <p>ChubGame</p>
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

            {successPopup && (
                <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 slide-down">
                    {successPopup}
                </div>
            )}

            {errorPopup && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 slide-down">
                    {errorPopup}
                </div>
            )}

            {warnPopup && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 slide-down">
                    {warnPopup}
                </div>
            )}

            {infoPopup && (
                <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 slide-down">
                    {infoPopup}
                </div>
            )}
        </div>
    );
};

export default App;
