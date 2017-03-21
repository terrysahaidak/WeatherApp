'use strict'

const APPID = '5a754ab1f6cbcce99d590687d9f1bf3a'
const noop = () => {}

class App {
  constructor(appId) {
    this.controller = new Controller(appId)
    this.router = new Router()

    this._init = this._init.bind(this)

    this.router
      .add('/', this.controller.onHomeRoute)
      .add('/search', this.controller.onSearchRoute)
      .add('*', this.controller.onNotFoundRoute)

    this._init()
  }

  _init() {
    document.addEventListener("DOMContentLoaded", () => this.router.run())
  }
}

class Controller {
  constructor(appId) {
    this.api = new Api(appId)
    this.store = new Map()
    this.view = new View()

    this._handleTextInputChange = this._handleTextInputChange.bind(this)
    this._handleFindButtonClick = this._handleFindButtonClick.bind(this)
    this._renderHeader = this._renderHeader.bind(this)

    this.onSearchRoute = this.onSearchRoute.bind(this)
    this.onHomeRoute = this.onHomeRoute.bind(this)
    this.onNotFoundRoute = this.onNotFoundRoute.bind(this)
  }

  _handleTextInputChange(evt) {
    this.store.set('input', evt.target.value)
  }

  _handleFindButtonClick() {
    const value = this.store.get('input')
    history.pushState({route: ''}, null, `/search?q=${value}`)
  }

  _renderHeader() {
    this.view.renderHeader({
      onTextInputChange: this._handleTextInputChange,
      onButtonClick: this._handleFindButtonClick,
      inputValue: this.store.get('input') || ''
    })
  }

  onSearchRoute(location) {
    const value = location.search.split('q=')[1] || ''
    this.store.set('input', value)
    this._renderHeader()
    this.view.renderLoading()
    this.api.findCity(value)
      .then(json => {
        this.view.renderSearchResults(json, item => console.log(item))
      })
      .catch(error => this.view.renderError(error.message))
  }

  onHomeRoute() {
    this._renderHeader()
    this.view.renderHome()
  }

  onNotFoundRoute() {
    this._renderHeader()
    this.view.renderNotFound()
  }
}

class View {
  constructor() {
    this.$ = document.getElementById('view')
    this.$header = document.getElementById('header')

    this._changeContent = this._changeContent.bind(this)
    this.renderHeader = this.renderHeader.bind(this)
  }

  _changeContent(html, root = this.$) {
    if (typeof html === 'string') {
      root.innerHTML = html
    } else {
      // remove all childs
      while (root.firstChild) {
        root.removeChild(root.firstChild)
      }
      // append new child into container
      if (Array.isArray(html)) {
        html.forEach(item => root.appendChild(item))
      } else {
        root.appendChild(html)
      }
    }
  }

  renderHeader({onTextInputChange = noop, onButtonClick = noop, inputValue = ''}) {
    const input = document.createElement('input', {type: 'text'})
    input.oninput = onTextInputChange
    input.value = inputValue

    const button = document.createElement('button')
    button.innerText = 'Find'
    button.addEventListener('click', onButtonClick)
    this._changeContent([input, button], this.$header)
  }

  renderSearchResults(result, onItemClick) {
    if (result.count === 0) {
      this.renderEmpty()
    } else {
      const content = document.createElement('ul')
      content.className = 'cityList'
      result.list.forEach(item => {
        const el = document.createElement('li')
        el.innerText = item.name
        el.addEventListener('click', () => onItemClick(item))
        content.appendChild(el)
      })

      this._changeContent(content)
    }
  }

  renderHome() {
    this._changeContent('Please, type your city into the input and press find button.')
  }

  renderNotFound() {
    this._changeContent('Not found, 404')
  }

  renderLoading() {
    this._changeContent('Loading...')
  }

  renderError(message) {
    this._changeContent(`Error: ${message}`)
  }

  renderEmpty() {
    this._changeContent('No such city...')
  }
}

class Router {
  constructor() {
    this._interval = null
    this._oldLocation = null
    this._routes = new Map()

    this._listen = this._listen.bind(this)
    this._handleRouteChange = this._handleRouteChange.bind(this)
    this.add = this.add.bind(this)
    this.run = this.run.bind(this)
  }

  get _location() {
    return window.location
  }

  _handleRouteChange(loc) {
    const route = this._routes.get(loc.pathname)
    if (route) {
      route(loc)
    } else {
      this._routes.get('*')()
    }
  }

  add(pathname, callback) {
    this._routes.set(pathname, callback)
    return this
  }

  run() {
    this._listen(this._handleRouteChange)
  }

  _listen(onChange) {
    clearInterval(this._interval)

    this._interval = setInterval(() => {
      if (this._oldLocation === null) {
        this._oldLocation = Object.assign({}, this._location)
        this._handleRouteChange(this._location)
      } else if (this._oldLocation.href === this._location.href) {
        // console.log('same location')
      } else {
        // console.log('change')
        this._oldLocation = Object.assign({}, this._location)
        onChange(this._location)
      }
    }, 50)
  }

  unlisten() {
    return clearInterval(this._interval)
  }
}

class Api {
  constructor(APPID) {
    this.APPID = APPID
  }

  fetchData(method, param) {
    return fetch(`http://api.openweathermap.org/data/2.5/${method}?${param}n&APPID=${this.APPID}`)
  .then(raw => raw.json())
  }

  findCity(city) {
    return this.fetchData('find', `q=${city}`)
  }
}

const app = new App(APPID)
