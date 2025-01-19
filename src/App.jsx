/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-17 14:40:19
 * @FilePath: \DiceRollerSimulator-ThreeJS\src\App.jsx
 * @Description: 
 * 
 */
import { useState, useEffect } from 'react';
import { createDices } from './3d.js';
import { FaCopy, FaInfoCircle, FaCoins, FaArrowLeft, FaPlay, FaForward, FaTimes, FaCheck, FaSave } from 'react-icons/fa';

const VALIDATE_PROMOTION_CODE_API = import.meta.env.VITE_VALIDATE_PROMOTION_CODE_API;
const SEND_DICE_DATA_API = import.meta.env.VITE_SEND_DICE_DATA_API;
const CHECK_BALANCE_API = import.meta.env.VITE_CHECK_BALANCE_API;
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
    const [showChipsDialog, setShowChipsDialog] = useState(false);
    const [selectedChips, setSelectedChips] = useState('');
    const [customChips, setCustomChips] = useState('');
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0});
    const [showRegulationDialog, setShowRegulationDialog] = useState(false);
    const [showAboutDialog, setShowAboutDialog] = useState(false);

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

    const handleOpenRegulation = () => {
        setShowRegulationDialog(true);
    };

    const handleOpenAbout = () => {
        setShowAboutDialog(true);
    };

    const handleCloseRegulation = () => {
        setShowRegulationDialog(false);
    };

    const handleCloseAbout = () => {
        setShowAboutDialog(false);
    };

    // Generate a random promotion code when the component mounts
    const generatePromotionCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setPromotionCode(code);
    };

    const handleMouseEnter = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        setShowHint(true);
    };

    const handleMouseLeave = () => {
        setShowHint(false);
    };

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

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
        if (diceAmount === 1) {
            console.warn('Minimum dice amount of 1 reached');
            setWarnPopup('Minimum dice amount of 1 reached');
            setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
        } else {
            setDiceAmount((d) => d - 1);
        }
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
        generatePromotionCode();
        setPromotionSkipped(true);
        setShowPromotionDialog(false);
        setShowChipsDialog(true);
    };

    // We need to add the api endpoint in the wordpress backend
    const sendDiceData = async (diceAmount, totalPoints, promotionCode, isPromotionUser, chips) => {
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
                    chips,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data.message || 'Error sending data' };
            }
            console.log('Response from backend:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Error sending data to backend:', error);
            return { success: false, message: error.message || 'Error sending data' };
        }
    };

    const validatePromotionCode = async (code) => {
        const regex = /^[a-zA-Z0-9]{16}$/;
        if (!code) {
            return { valid: false, message: 'Promotion code is required' };
        }
        if (!regex.test(code)) {
            return { valid: false, message: 'Promotion code must be 16 characters long and contain only letters and numbers' };
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
                return { valid: false, message: data.message || 'Error validating promotion code' };
            }
            if (data.message != 'success' && !data.data.valid) {
                return { valid: false, message: 'Invalid promotion code' };
            }
            console.log('Response from backend:', data);
            return { valid: true };
        } catch (error) {
            console.error('Error validating promotion code:', error);
            return { valid: false, message: 'Error validating promotion code' };
        }
    };

    const handleSubmitPromotion = async () => {
        const result = await validatePromotionCode(promotionCode);
        if (!result.valid) {
            console.error('Error validating promotion code:', result.message);
            setErrorPopup(error);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setPromotionSkipped(false);
        setShowPromotionDialog(false);
        setShowChipsDialog(true);
    };

    const validateAccountBalance = async (username, chips) => {
        try {
            const response = await fetch(CHECK_BALANCE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, chips }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { valid: false, message: data.message || 'Error checking balance' };
            }
            if (data.data.status !== 'success') {
                return { valid: false, message: 'Insufficient balance' };
            }
            console.log('Response from backend:', data);
            return { valid: true, balance: data.data.balance };
        } catch (error) {
            console.error('Error checking balance:', error);
            return { valid: false, message: 'Error checking balance' };
        }
    };

    const handlePlay = async () => {
        const chips = selectedChips || customChips;
        const result = await validateAccountBalance(username, chips);
        if (!result.valid) {
            console.error(result.message);
            setErrorPopup(result.message);
            return;
        }
        setShowChipsDialog(false);
        // Start the game with the selected/customized chips
        console.log('Selected Chips:', chips);
    };

    const handleGenerate = async () => {
        // Determine the chips to use
        const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
        const result = await sendDiceData(diceAmount, totalPoints, promotionCode, true, username, chips);
        if (!result.success) {
            console.error('Error saving promotion code:', result.message);
            setErrorPopup(result.message);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setSuccessPopup('Promotion code submitted successfully');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
    };

    const handleSubmit = async () => {
        setSuccessPopup('Copy the promotion code to use it again');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setShowPopup(false);
        setShowCopyDialog(true);
    };

    const handleSave = async () => {
        // Determine the chips to use
        const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
        const result = await sendDiceData(diceAmount, totalPoints, promotionCode, false, chips);
        if (!result.success) {
            console.error('Error submitting promotion code:', error);
            setErrorPopup('Error submitting promotion code');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setSuccessPopup('Promotion code submitted successfully');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    const handleCopyPromotionCode = async () => {
        try {
            await navigator.clipboard.writeText(promotionCode);
            setSuccessPopup('Promotion code copied to clipboard');
            setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        } catch (error) {
            console.error('Error copying promotion code:', error);
            setErrorPopup('Error copying promotion code');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
        }
    };

    return (
        <div className="font-['Cherry_Bomb_One',system-ui] select-none">
            {showPromotionDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Enter Promotion Code</h2>
                        <div className="relative">
                            <input
                                type="text"
                                value={promotionCode}
                                onChange={(e) => setPromotionCode(e.target.value)}
                                className="border p-2 mb-4 w-96"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onMouseMove={handleMouseMove}
                            />
                            {showHint && (
                                <div
                                    className="absolute bg-orange-500 text-white text-sm rounded p-2 flex items-center"
                                    style={{ top: mousePosition.y - 450, left: mousePosition.x - 750 }}
                                >
                                    <FaInfoCircle className="mr-2" /> Enter your promotion code here
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleSkipPromotion}
                                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaForward className="mr-2" /> Skip
                            </button>
                            <button
                                onClick={handleSubmitPromotion}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaPlay className="mr-2" /> Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChipsDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Select or Enter Betting Chips</h2>
                        <div className="mb-4 flex">
                            <button
                                onClick={() => setSelectedChips('10')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '10' ? 'bg-green-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 10
                            </button>
                            <button
                                onClick={() => setSelectedChips('20')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '20' ? 'bg-green-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 20
                            </button>
                            <button
                                onClick={() => setSelectedChips('50')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '50' ? 'bg-green-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 50
                            </button>
                        </div>
                        <input
                            type="text"
                            value={customChips}
                            onChange={(e) => setCustomChips(e.target.value)}
                            placeholder="Enter custom chips"
                            className="border p-2 mb-4 w-full"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}
                        />
                        {showHint && (
                            <div
                                className="absolute bg-orange-500 text-white text-sm rounded p-2 flex items-center"
                                style={{ top: mousePosition.y + 20, left: mousePosition.x + 20 }}
                            >
                                <FaInfoCircle className="mr-2" /> Enter a custom chip amount between 10 and 100
                            </div>
                        )}
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowChipsDialog(false);
                                    setShowPromotionDialog(true);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaArrowLeft className="mr-2" /> Back
                            </button>
                            <button
                                onClick={() => {
                                    const customChipsValue = parseInt(customChips, 10);
                                    if (!selectedChips && !customChips) {
                                        setErrorPopup('You need to select or enter the chip amounts');
                                        setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
                                    } else if (customChips && (customChipsValue > 100 || customChipsValue < 10)) {
                                        setWarnPopup('Custom chips must be between 10 and 100');
                                        setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
                                    } else {
                                        handlePlay();
                                    }
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaPlay className="mr-2" /> Play
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed top-3 left-3 text-[36px]">
                <p
                    onClick={handleOpenRegulation} 
                    className="duration-300 active:scale-125 transition-transform hover:scale-105"
                >
                    Game Regulation</p>
                <p
                    onClick={handleOpenAbout} 
                    className="duration-300 active:scale-125 transition-transform hover:scale-105"
                >
                    About ChubGame
                </p>
            </div>

            {showRegulationDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg text-center relative max-w-lg mx-auto">
                        <button
                            onClick={handleCloseRegulation}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes />
                        </button>
                        <h2 className="text-2xl font-bold mb-4">Game Regulation</h2>
                        <div className="text-left">
                            <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
                                <p className="font-bold">Objective:</p>
                                <p>The goal of the game is to roll the dice and achieve the highest possible score.</p>
                            </div>
                            <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                                <p className="font-bold">Rules:</p>
                                <ul className="list-disc list-inside">
                                    <li>Each player takes turns to roll the dice.</li>
                                    <li>Players can roll up to a maximum of 6 dice at a time.</li>
                                    <li>The total points are calculated based on the sum of the dice values.</li>
                                    <li>Special combinations of dice rolls may yield bonus points.</li>
                                </ul>
                            </div>
                            <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                                <p className="font-bold">Scoring:</p>
                                <ul className="list-disc list-inside">
                                    <li>Each die face value contributes to the total score.</li>
                                    <li>Rolling a 6 on all dice grants a bonus of 50 points.</li>
                                    <li>Rolling three of a kind grants a bonus of 20 points.</li>
                                </ul>
                            </div>
                            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                                <p className="font-bold">Penalties:</p>
                                <ul className="list-disc list-inside">
                                    <li>Rolling a 1 on any die results in a penalty of 5 points.</li>
                                    <li>Rolling two 1s results in a penalty of 10 points.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={handleCloseRegulation}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAboutDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg text-center relative max-w-lg mx-auto">
                        <button
                            onClick={handleCloseAbout}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes />
                        </button>
                        <h2 className="text-2xl font-bold mb-4">About ChubGame</h2>
                        <div className="text-left">
                            <p className="mb-4">MIT License</p>
                            <p className="mb-4">Copyright (c) 2025 ChubGame</p>
                            <p className="mb-4">
                                Permission is hereby granted, free of charge, to any person obtaining a copy
                                of this software and associated documentation files (the "Software"), to deal
                                in the Software without restriction, including without limitation the rights
                                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                copies of the Software, and to permit persons to whom the Software is
                                furnished to do so, subject to the following conditions:
                            </p>
                            <p className="mb-4">
                                The above copyright notice and this permission notice shall be included in all
                                copies or substantial portions of the Software.
                            </p>
                            <p className="mb-4">
                                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                                SOFTWARE.
                            </p>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={handleCloseAbout}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-[#0000009a]">
                <p className="text-[18px] relative">AMOUNT: {diceAmount}</p>
                <div className="text-[64px] cursor-pointer flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleClickSubtract}
                        className="duration-300 active:scale-125 transition-transform hover:scale-105"
                    >
                        -
                    </button>
                    <button
                        type="button"
                        onClick={handleClickRoll}
                        className="duration-300 active:scale-125 transition-transform hover:scale-105"
                    >
                        ROLL
                    </button>
                    <button
                        type="button"
                        onClick={handleClickAdd}
                        className="duration-300 active:scale-125 transition-transform hover:scale-105"
                    >
                        +
                    </button>
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <p className="text-xl">Total Points: {totalPoints}</p>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={closePopup}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                            {promotionSkipped ? (
                                // If the promotion was skipped, show the submit button
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                                >
                                    <FaCheck className="mr-2" /> Generate
                                </button>
                            ) : (
                                // If the promotion was not skipped, show the save button
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                                >
                                    <FaSave className="mr-2" /> Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCopyDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Promotion Code</h2>
                        <div
                            className="flex items-center space-x-2 relative"
                        >
                            <div
                                className="border p-2 rounded bg-gray-100 w-64"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onMouseMove={handleMouseMove}
                            >
                                {promotionCode}
                            </div>
                            <button
                                onClick={handleCopyPromotionCode}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaCopy className="mr-2" /> Copy
                            </button>
                            {showHint && (
                                <div
                                    className="absolute bg-orange-400 text-white text-sm rounded p-2 flex items-center"
                                    style={{ top: mousePosition.y - 400, left: mousePosition.x - 300 }}
                                >
                                    <FaInfoCircle className="mr-2" /> Click to copy the promotion code
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCopyDialog(false);
                                    setShowPopup(true);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaArrowLeft className="mr-2" /> Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaCheck className="mr-2" /> Submit
                            </button>
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
