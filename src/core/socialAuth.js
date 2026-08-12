let googleScriptPromise = null

export function loadGoogleScript() {
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Không tải được script Google.'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

let facebookScriptPromise = null

export function loadFacebookScript(appId) {
  if (facebookScriptPromise) return facebookScriptPromise

  facebookScriptPromise = new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB)

    window.fbAsyncInit = function () {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' })
      resolve(window.FB)
    }

    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Không tải được script Facebook.'))
    document.head.appendChild(script)
  })

  return facebookScriptPromise
}
