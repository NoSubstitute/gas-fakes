import { FakeAdvResource } from '../common/fakeadvresource.js';
import { Proxies } from '../../support/proxies.js';
import { gError, normalizeSerialization } from '../../support/helpers.js';
import { Syncit } from '../../support/syncit.js';

export const newFakeAdvGmailDrafts = (...args) => Proxies.guard(new FakeAdvGmailDrafts(...args));

class FakeAdvGmailDrafts extends FakeAdvResource {
  constructor(mainService) {
    super(mainService, 'users', Syncit.fxGmail);
    this.gmail = mainService;
    this.__fakeObjectType = 'Gmail.Users.Drafts';
  }

  /**
   * Creates a new draft with the DRAFT label.
   * @param {object} resource - The draft resource to create.
   * @param {string} userId - The user's email address. The special value me can be used to indicate the authenticated user.
   * @returns {object} The created draft resource.
   */
  create(resource, userId) {
    const { data, response } = this._call(
      'create',
      { userId, requestBody: normalizeSerialization(resource) },
      null,
      'drafts'
    );
    gError(response, 'gmail', 'users.drafts.create');
    return data;
  }
}