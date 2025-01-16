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

    // TODO: We need to add the api endpoint in the wordpress backend
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
        setShowChipsDialog(true);
    };

    const handlePlay = () => {
        setShowChipsDialog(false);
        // Start the game with the selected/customized chips
        console.log('Selected Chips:', selectedChips || customChips);
    };

    const handleGenerate = async () => {
        try {
            // Determine the chips to use
            const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
            await sendDiceData(diceAmount, totalPoints, promotionCode, true, chips);
            setSuccessPopup('Promotion code submitted successfully');
            setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        } catch (error) {
            console.error('Error saving promotion code:', error);
            setErrorPopup('Error saving promotion code');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
        }
    };

    const handleSubmit = async () => {
        setSuccessPopup('Copy the promotion code to use it again');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setShowPopup(false);
        setShowCopyDialog(true);
    };

    const handleSave = async () => {
        try {
            // Determine the chips to use
            const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
            await sendDiceData(diceAmount, totalPoints, promotionCode, false, chips);
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
                <p>DICE 3D</p>
                <p>ChubGame</p>
            </div>

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
