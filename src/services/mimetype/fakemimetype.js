
import { Proxies } from '../../support/proxies.js';

/**
 * @class
 * @implements {GoogleAppsScript.Base.MimeType}
 */
export class FakeMimeType {
    constructor() {

        const props = {
            BMP: 'image/bmp',
            CSS: 'text/css',
            CSV: 'text/csv',
            FOLDER: 'application/vnd.google-apps.folder',
            GIF: 'image/gif',
            GOOGLE_APPS_SCRIPT: 'application/vnd.google-apps.script',
            GOOGLE_DOCS: 'application/vnd.google-apps.document',
            GOOGLE_DRAWINGS: 'application/vnd.google-apps.drawing',
            GOOGLE_FORMS: 'application/vnd.google-apps.form',
            GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet',
            GOOGLE_SITES: 'application/vnd.google-apps.site',
            GOOGLE_SLIDES: 'application/vnd.google-apps.presentation',
            HTML: 'text/html',
            JAVASCRIPT: 'application/javascript',
            JPEG: 'image/jpeg',
            MICROSOFT_EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            MICROSOFT_EXCEL_LEGACY: 'application/vnd.ms-excel',
            MICROSOFT_POWERPOINT: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            MICROSOFT_POWERPOINT_LEGACY: 'application/vnd.ms-powerpoint',
            MICROSOFT_WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            MICROSOFT_WORD_LEGACY: 'application/msword',
            OPENDOCUMENT_GRAPHICS: 'application/vnd.oasis.opendocument.graphics',
            OPENDOCUMENT_PRESENTATION: 'application/vnd.oasis.opendocument.presentation',
            OPENDOCUMENT_SPREADSHEET: 'application/vnd.oasis.opendocument.spreadsheet',
            OPENDOCUMENT_TEXT: 'application/vnd.oasis.opendocument.text',
            PDF: 'application/pdf',
            PLAIN_TEXT: 'text/plain',
            PNG: 'image/png',
            RTF: 'application/rtf',
            SHORTCUT: 'application/vnd.google-apps.shortcut',
            SVG: 'image/svg+xml',
            ZIP: 'application/zip'
        }
        Reflect.ownKeys(props).forEach(f => this[f] = props[f])

    }


    toString() {
        return 'MimeType';
    }
}

/**
 * @returns {FakeLogger}
 */
export const newFakeMimeType = (...args) => Proxies.guard(new FakeMimeType(...args));
