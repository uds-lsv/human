import { SETTINGS } from '../settings'

export class Service {
    constructor() {}

    static filesettings = {
        async: true,
        crossDomain: true,
        method: 'POST',
        headers: {},
        processData: false,
        contentType: false,
        mimeType: 'multipart/form-data',
    }

    static jsonsettings = {
        async: true,
        crossDomain: true,
        method: 'POST',
        headers: {},
        processData: false,
        contentType: 'application/json;charset=UTF-8',
        // mimeType: 'application/json'
    }

    static get(url, params?) {
        return $.get(SETTINGS.URL + url, params)
    }

    static post(url: string, type?: 'json' | 'file', data?) {
        let settings: any = {}
        if (type === 'json') {
            settings = Object.assign(settings, this.jsonsettings)
        } else if (type === 'file') {
            settings = Object.assign(settings, this.filesettings)
        } else {
            settings = Object.assign(settings, this.jsonsettings)
        }
        settings.url = SETTINGS.URL + url
        settings.data = data
        return $.ajax(settings)
    }
    static fetch(url: string) {
        return fetch(SETTINGS.URL + url)
    }
}
