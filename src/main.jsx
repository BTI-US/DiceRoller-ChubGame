/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-05 12:20:35
 * @FilePath: \DiceRoller-ChubGame\src\main.jsx
 * @Description: 
 * 
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
