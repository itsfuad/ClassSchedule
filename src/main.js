import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

//install service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-class-chart.js')
      .then(reg => console.log('Service Worker: Registered'))
      .catch(err => console.log(`Service Worker: Error: ${err}`))
  })
}

export default app
