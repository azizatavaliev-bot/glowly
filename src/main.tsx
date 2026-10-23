import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Studio from './studio/Studio'
import Format from './studio/Format'
import Feed from './studio/Feed'
import Export from './studio/Export'
import './styles.css'
import { OPT } from './mode'

// опт: только современный шрифт, без курсива с засечками (23.10.2026)
if (OPT) document.documentElement.classList.add('opt')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* служебная студия постов Instagram — по прямой ссылке /insta, покупатели её не видят */}
    {/^\/insta\/?$/.test(location.pathname) ? <Studio /> : /^\/format\/?$/.test(location.pathname) ? <Format /> : /^\/feed\/?$/.test(location.pathname) ? <Feed /> : /^\/export\/?$/.test(location.pathname) ? <Export /> : <App />}
  </React.StrictMode>,
)
