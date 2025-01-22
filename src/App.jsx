/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-21 14:40:19
 * @FilePath: \DiceRollerSimulator-ThreeJS\src\App.jsx
 * @Description: 
 * 
 */
import { useState, useEffect } from 'react';
import { createDices } from './3d.js';
import { FaCopy, FaInfoCircle, FaCoins, FaArrowLeft, FaPlay, FaForward, FaTimes, FaCheck, FaSave, FaBook, FaRedo } from 'react-icons/fa';
import gameImage from '../images/game.png';

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const VALIDATE_PROMOTION_CODE_API = import.meta.env.VITE_VALIDATE_PROMOTION_CODE_API;
const SEND_DICE_DATA_API = import.meta.env.VITE_SEND_DICE_DATA_API;
const CHECK_BALANCE_API = import.meta.env.VITE_CHECK_BALANCE_API;
const MAX_DICE_AMOUNT = parseInt(import.meta.env.VITE_MAX_DICE_AMOUNT, 10);  // Parsing as an integer
const MIN_CHIPS_AMOUNT = parseInt(import.meta.env.VITE_MIN_CHIPS_AMOUNT, 10);  // Parsing as an integer
const MAX_CHIPS_AMOUNT = parseInt(import.meta.env.VITE_MAX_CHIPS_AMOUNT, 100);  // Parsing as an integer

const App = () => {
    const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
    const [diceAmount, setDiceAmount] = useState(6);
    const [totalPoints, setTotalPoints] = useState(null);
    const [showTotalPointsDialog, setShowTotalPointsDialog] = useState(false);
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);
    const [promotionCode, setPromotionCode] = useState('');
    const [promotionSkipped, setPromotionSkipped] = useState(false);
    const [singlePlayer, setSinglePlayer] = useState(false);
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
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [showFinalDialog, setShowFinalDialog] = useState(false);
    const [openedFromWelcome, setOpenedFromWelcome] = useState(false);

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

    const handleStartPvE = () => {
        setSuccessPopup('Starting PvE game...');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setSinglePlayer(true);
        setShowWelcomeDialog(false);
        setShowChipsDialog(true);
    };
    
    const handleStartPvP = () => {
        setSuccessPopup('Starting PvP game...');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setSinglePlayer(false);
        setShowWelcomeDialog(false);
        setShowPromotionDialog(true);
    };

    const handleOpenRegulation = () => {
        setShowRegulationDialog(true);
        if (showWelcomeDialog) {
            setOpenedFromWelcome(true);
            setShowWelcomeDialog(false);
        }
    };

    const handleOpenAbout = () => {
        setShowAboutDialog(true);
        if (showWelcomeDialog) {
            setOpenedFromWelcome(true);
            setShowWelcomeDialog(false);
        }
    };

    const handleCloseRegulation = () => {
        setShowRegulationDialog(false);
        if (openedFromWelcome) {
            setShowWelcomeDialog(true);
            setOpenedFromWelcome(false); // Reset the state
        }
    };

    const handleCloseAbout = () => {
        setShowAboutDialog(false);
        if (openedFromWelcome) {
            setShowWelcomeDialog(true);
            setOpenedFromWelcome(false); // Reset the state
        }
    };

    const handleShowResult = async () => {
        // Determine the chips to use
        const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
        var result;
        if (singlePlayer) {
            result = await sendDiceData(diceAmount, totalPoints, '', false, chips);
        } else {
            result = await sendDiceData(diceAmount, totalPoints, promotionCode, true, chips);
        }
        if (!result.success) {
            console.error('Error submitting game result:', result.message);
            setErrorPopup(result.message);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setResultData(result.data); // Store the result data
        setSuccessPopup('Promotion code submitted successfully');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setShowTotalPointsDialog(false);
        setShowResultDialog(true);
    };

    // (Deprecated) Generate a random promotion code when the component mounts
    // const generatePromotionCode = () => {
    //     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     let code = '';
    //     for (let i = 0; i < 16; i++) {
    //         code += characters.charAt(Math.floor(Math.random() * characters.length));
    //     }
    //     setPromotionCode(code);
    // };

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
        if (!promotionSkipped && !singlePlayer) {
            console.warn('Cannot add dice when you are the promotion code user');
            setWarnPopup('Cannot add dice when you are the promotion code user');
            setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
            return;
        }

        if (diceAmount < MAX_DICE_AMOUNT) {
            setDiceAmount((d) => d + 1);
        } else {
            console.warn(`Maximum dice amount of ${MAX_DICE_AMOUNT} reached`);
            setWarnPopup(`Maximum dice amount of ${MAX_DICE_AMOUNT} reached`);
            setTimeout(() => setWarnPopup(''), 3000); // Hide error popup after 3 seconds
        }
    };

    const handleClickSubtract = () => {
        if (!promotionSkipped && !singlePlayer) {
            console.warn('Cannot subtract dice when you are the promotion code user');
            setWarnPopup('Cannot subtract dice when you are the promotion code user');
            setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
            return;
        }

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
                setShowTotalPointsDialog(true);
            } else {
                console.error('createDices did not return an array of points');
            }
        } catch (error) {
            console.error('Error in createDices:', error);
        }
    };

    // We need to add the api endpoint in the wordpress backend
    const sendDiceData = async (diceAmount, totalPoints, promotionCode, isPromotionUser, chips) => {
        if (DEBUG_MODE) {
            // Simulate a successful response in debug mode
            console.log('Debug mode: Simulating API response');
            return {
                success: true,
                data: {
                    status: 'success',
                    balance: 1000, // Example balance
                    result: totalPoints > 50 ? 100 : -50, // Example result based on totalPoints
                    promotion_code: promotionCode || 'DEBUGCODE1234567' // Example promotion code
                }
            };
        }

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
            return { success: true, data: data.data };
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

        if (DEBUG_MODE) {
            // Simulate a successful validation in debug mode
            console.log('Debug mode: Simulating promotion code validation');
            return { valid: true, amount: 5 };
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
            return { valid: true, amount: data.data.parent_dice_amount };
        } catch (error) {
            console.error('Error validating promotion code:', error);
            return { valid: false, message: 'Error validating promotion code' };
        }
    };

    const handleSubmitPromotion = async () => {
        const result = await validatePromotionCode(promotionCode);
        if (!result.valid) {
            console.error('Error validating promotion code:', result.message);
            setErrorPopup(result.message);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setDiceAmount(result.amount);
        setSuccessPopup(`Promotion code is valid, dice amount set to ${result.amount} which is the same as the parent user`);
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setPromotionSkipped(false);
        setShowPromotionDialog(false);
        setShowChipsDialog(true);
    };

    const validateAccountBalance = async (username, chips) => {
        if (DEBUG_MODE) {
            // Simulate a successful balance validation in debug mode
            console.log('Debug mode: Simulating account balance validation');
            return { valid: true, balance: 1000 }; // Example balance
        }

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
        const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
        const result = await validateAccountBalance(username, chips);
        if (!result.valid) {
            console.error(result.message);
            setErrorPopup(result.message);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return;
        }
        setShowChipsDialog(false);
        // Start the game with the selected/customized chips
        console.log('Selected Chips:', chips);
    };

    const sendDataToBackend = async () => {
        // Determine the chips to use
        const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
        const result = await sendDiceData(diceAmount, totalPoints, '', true, username, chips);
        if (!result.success) {
            console.error('Error saving promotion code:', result.message);
            setErrorPopup(result.message);
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
            return 'Promotion Code Not Available';
        }
        setSuccessPopup('Promotion code submitted successfully');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        return result.data.promotion_code;
    };

    const handleGenerateCode = async () => {
        //generatePromotionCode();        // TODO: Marked as deprecated
        const promotion_code = await sendDataToBackend();
        setPromotionCode(promotion_code);
        setSuccessPopup('Copy the promotion code to use it again');
        setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
        setShowTotalPointsDialog(false);
        setShowCopyDialog(true);
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

    const handleChipsSelection = () => {
        const customChipsValue = parseInt(customChips, 10);
        if (!selectedChips && !customChips) {
            setErrorPopup('You need to select or enter the chip amounts');
            setTimeout(() => setErrorPopup(''), 3000); // Hide error popup after 3 seconds
        } else if (customChips && (customChipsValue > MAX_CHIPS_AMOUNT || customChipsValue < MIN_CHIPS_AMOUNT)) {
            setWarnPopup(`Custom chips must be between ${MIN_CHIPS_AMOUNT} and ${MAX_CHIPS_AMOUNT}`);
            setTimeout(() => setWarnPopup(''), 3000); // Hide warning popup after 3 seconds
        } else {
            const chips = customChips !== '' ? parseInt(customChips, 10) : parseInt(selectedChips, 10);
            setSuccessPopup(`Your bet is ${chips} chips, game will be started`);
            setTimeout(() => setSuccessPopup(''), 3000); // Hide success popup after 3 seconds
            handlePlay();
        }
    };

    return (
        <div className="font-['Cherry_Bomb_One',system-ui] select-none">
            {(showWelcomeDialog || showPromotionDialog || showChipsDialog || showRegulationDialog || showAboutDialog || showTotalPointsDialog || showResultDialog || showCopyDialog || showFinalDialog) && (
                <div className="overlay fixed inset-0 bg-black bg-opacity-20 z-10"></div>
            )}

            {showWelcomeDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <div className="flex justify-center mb-4">
                            <img src={gameImage} alt="Game" className="w-1000 h-20" />
                        </div>
                        <h2 className="text-4xl mb-4">Welcome to ChubGame!</h2>
                        <p className="text-xl mb-4">Get ready to play the exciting 3D dice game and earn your chips!</p>
                        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 flex items-center">
                            <FaInfoCircle className="mr-2" />
                            <p>Click the following button to read our game regulation and our policy.</p>
                        </div>
                        <div className="flex justify-center space-x-4 mb-4">
                            <button
                                onClick={handleOpenRegulation}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaBook className="mr-2" /> Game Regulation
                            </button>
                            <button
                                onClick={handleOpenAbout}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaInfoCircle className="mr-2" /> About ChubGame
                            </button>
                        </div>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => window.close()}
                                className="px-4 py-2 bg-red-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                            <button
                                onClick={handleStartPvE}
                                className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaPlay className="mr-2" /> Start PvE
                            </button>
                            <button
                                onClick={handleStartPvP}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaPlay className="mr-2" /> Start PvP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPromotionDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
                                onClick={() => {
                                    setShowPromotionDialog(false);
                                    setShowWelcomeDialog(true);
                                }}
                                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaArrowLeft className="mr-2" /> Back
                            </button>
                            <button
                                onClick={() => {
                                    setPromotionSkipped(true);
                                    setShowPromotionDialog(false);
                                    setShowChipsDialog(true);
                                }}
                                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaForward className="mr-2" /> Skip
                            </button>
                            <button
                                onClick={handleSubmitPromotion}
                                className="mr-2 px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaPlay className="mr-2" /> Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChipsDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Select or Enter Betting Chips</h2>
                        <div className="mb-4 flex">
                            <button
                                onClick={() => setSelectedChips('10')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '10' ? 'bg-red-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 10
                            </button>
                            <button
                                onClick={() => setSelectedChips('25')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '25' ? 'bg-green-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 25
                            </button>
                            <button
                                onClick={() => setSelectedChips('50')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '50' ? 'bg-blue-500' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 50
                            </button>
                            <button
                                onClick={() => setSelectedChips('100')}
                                className={`mr-2 px-6 py-2 rounded ${selectedChips === '100' ? 'bg-black' : 'bg-gray-500'} text-white transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 flex items-center`}
                            >
                                <FaCoins className="mr-2" /> 100
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
                                    if (singlePlayer) {
                                        setShowWelcomeDialog(true);
                                    } else {
                                        setShowPromotionDialog(true);
                                    }
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaArrowLeft className="mr-2" /> Back
                            </button>
                            <button
                                onClick={handleChipsSelection}
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
                    <div className="bg-white p-6 rounded shadow-lg text-center relative max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
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
                                <p className="font-bold">Parent User Rules:</p>
                                <ul className="list-disc list-inside">
                                    <li>Register with a promotion code.</li>
                                    <li>Store promotion code as parent.</li>
                                    <li>Save parent user and chips info.</li>
                                    <li>Trigger dice game (win/loss).</li>
                                    <li>Update parent points (win/loss).</li>
                                    <li>Check promotion code for validity.</li>
                                    <li>Validate promotion code.</li>
                                    <li>Notify promotion code valid.</li>
                                    <li>Adjust points and chips based on game result.</li>
                                </ul>
                            </div>
                            <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                                <p className="font-bold">Child User Rules:</p>
                                <ul className="list-disc list-inside">
                                    <li>Send promotion code and username.</li>
                                    <li>Validate promotion code.</li>
                                    <li>Check promotion code validity.</li>
                                    <li>Return promotion code validity.</li>
                                    <li>Notify promotion code validity.</li>
                                    <li>Trigger dice game (win/loss).</li>
                                    <li>Update child points (win/loss).</li>
                                    <li>Adjust points and chips based on game result.</li>
                                </ul>
                            </div>
                            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                                <p className="font-bold">PvE Single Player Rules:</p>
                                <ul className="list-disc list-inside">
                                    <li>Start PvE game.</li>
                                    <li>Generate random win/loss.</li>
                                    <li>If player wins, add double chips to player balance.</li>
                                    <li>Notify win and update balance.</li>
                                    <li>If player loses, deduct chips from player balance.</li>
                                    <li>Notify loss and update balance.</li>
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
                    <div className="bg-white p-6 rounded shadow-lg text-center relative max-w-lg mx-auto max-h-[90vh] overflow-y-aut">
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

            {showTotalPointsDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <p className="text-xl">Total Points: {totalPoints}</p>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => setShowTotalPointsDialog(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                            {singlePlayer ? (
                                <button
                                    onClick={handleShowResult}
                                    className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                                >
                                    <FaSave className="mr-2" /> Show Result
                                </button>
                            ) : (
                                promotionSkipped ? (
                                    <button
                                        onClick={handleGenerateCode}
                                        className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                                    >
                                        <FaCheck className="mr-2" /> Generate Promotion Code
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleShowResult}
                                        className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                                    >
                                        <FaSave className="mr-2" /> Show Result
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showResultDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Game Result</h2>
                        {resultData && (
                            <>
                                {resultData.result > 0 ? (
                                    <p className="mb-4 text-green-500 flex items-center">
                                        <FaCoins className="mr-2" /> You WIN: {resultData.result} points
                                    </p>
                                ) : (
                                    <p className="mb-4 text-red-500 flex items-center">
                                        <FaCoins className="mr-2" /> You LOST: {Math.abs(resultData.result)} points
                                    </p>
                                )}
                                <p className="mb-4">Your current balance is: {resultData.balance}</p>
                            </>
                        )}
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => window.close()}
                                className="px-4 py-2 bg-red-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowResultDialog(false);
                                    setShowWelcomeDialog(true);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaRedo className="mr-2" /> Play Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCopyDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
                                    setShowTotalPointsDialog(true);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaArrowLeft className="mr-2" /> Back
                            </button>
                            <button
                                onClick={() => {
                                    setShowCopyDialog(false);
                                    setShowFinalDialog(true);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaCheck className="mr-2" /> Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFinalDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg text-center">
                        <h2 className="text-xl mb-4">Promotion Code Generated</h2>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => window.close()}
                                className="px-4 py-2 bg-red-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowFinalDialog(false);
                                    setShowWelcomeDialog(true);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded transition-transform duration-300 hover:bg-yellow-500 hover:scale-105 active:bg-green-500 flex items-center"
                            >
                                <FaRedo className="mr-2" /> Play Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {successPopup && (
                <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 slide-down z-50">
                    {successPopup}
                </div>
            )}

            {errorPopup && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 slide-down z-50">
                    {errorPopup}
                </div>
            )}

            {warnPopup && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 slide-down z-50">
                    {warnPopup}
                </div>
            )}

            {infoPopup && (
                <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 slide-down z-50">
                    {infoPopup}
                </div>
            )}
        </div>
    );
};

export default App;
