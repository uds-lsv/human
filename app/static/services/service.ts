import { SETTINGS } from '../settings'

export class Service {
    constructor() {}

    static ajax_filesettings = {
        async: true,
        crossDomain: true,
        method: 'POST',
        headers: {},
        processData: false,
        contentType: false,
        mimeType: 'multipart/form-data',
    }

    static ajax_jsonsettings = {
        async: true,
        crossDomain: true,
        method: 'POST',
        headers: {},
        processData: false,
        contentType: 'application/json;charset=UTF-8',
        // mimeType: 'application/json'
    }
    static fetch_jsonsettings = {
        async: true,
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    }
    // TODO: test this
    static fetch_filesettings = {
        async: true,
        method: 'POST',
        headers: {},
        processData: false,
        contentType: false,
        mimeType: 'multipart/form-data',
    }

    static get(url, params?) {
        return $.get(SETTINGS.URL + url, params)
    }

    static post(url: string, type?: 'json' | 'file', data?) {
        let settings: any = {}
        if (type === 'json') {
            settings = Object.assign(settings, this.ajax_jsonsettings)
        } else if (type === 'file') {
            settings = Object.assign(settings, this.ajax_filesettings)
        } else {
            settings = Object.assign(settings, this.ajax_jsonsettings)
        }
        settings.url = SETTINGS.URL + url
        settings.data = data
        return $.ajax(settings)
    }
    static fetch(url: string) {
        return fetch(url)
    }

    static fetchpost(url: string, type?: 'json' | 'file', data?) {
        let settings: any = {}
        if (type === 'json') {
            settings = Object.assign(settings, this.fetch_jsonsettings)
        } else if (type === 'file') {
            settings = Object.assign(settings, this.fetch_filesettings)
        } else {
            settings = Object.assign(settings, this.fetch_jsonsettings)
        }
        settings.url = SETTINGS.URL + url
        settings.body = data
        return fetch(url, settings)
    }
}
