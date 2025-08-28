import is from '@sindresorhus/is';
import '../main.js';
import { initTests } from './testinit.js';
import { getSlidesPerformance, trasher, getDrivePerformance } from './testassist.js';

export const testSlides = (pack) => {
  const { unit, fixes } = pack || initTests();
  const toTrash = [];

  unit.section('SlidesApp basics', (t) => {
    // Test create()
    const presName = `gas-fakes-test-pres-${new Date().getTime()}`;
    const pres = SlidesApp.create(presName);
    toTrash.push(DriveApp.getFileById(pres.getId()));

    t.true(is.object(pres), 'create() should return an object');
    t.is(pres.getName(), presName, 'create() should set the presentation name');
    t.is(pres.toString(), 'Presentation', 'presentation.toString() should be "Presentation"');
    t.true(is.nonEmptyString(pres.getId()), 'created presentation should have an ID');
    t.true(pres.getUrl().includes(pres.getId()), 'created presentation URL should contain ID');

    // Test create() with a default name
    const newPres = SlidesApp.create('Untitled presentation');
    toTrash.push(DriveApp.getFileById(newPres.getId()));
    t.is(newPres.getName(), 'Untitled presentation', 'create() with default name should work');
    t.true(is.nonEmptyString(newPres.getId()), 'new presentation should have an ID');

    // Test openById()
    const openedPres = SlidesApp.openById(pres.getId());
    t.is(openedPres.getId(), pres.getId(), 'openById() should open the correct presentation');
    t.is(openedPres.getName(), pres.getName(), 'opened presentation should have correct name');

    // Test openByUrl()
    const openedByUrl = SlidesApp.openByUrl(pres.getUrl());
    t.is(openedByUrl.getId(), pres.getId(), 'openByUrl() should open the correct presentation');
    t.is(openedByUrl.getName(), pres.getName(), 'opened presentation by URL should have correct name');

    // Test openByUrl() with invalid URL
    t.threw(() => SlidesApp.openByUrl('http://invalid.url/'), 'openByUrl() should throw on invalid URL');


    // Test getActivePresentation()
    // This will be null unless documentId is set in gasfakes.json for container-bound script testing
    const activePres = SlidesApp.getActivePresentation();
    t.is(activePres, null, 'getActivePresentation() should be null if no documentId is set');

    // Test enums
    t.is(SlidesApp.PageType.SLIDE.toString(), 'SLIDE', 'should have PageType enum');
    t.is(SlidesApp.ShapeType.TEXT_BOX.toString(), 'TEXT_BOX', 'should have ShapeType enum');
    t.is(SlidesApp.PredefinedLayout.TITLE_AND_BODY.toString(), 'TITLE_AND_BODY', 'should have PredefinedLayout enum');

    if (SlidesApp.isFake) {
      console.log('...cumulative slides cache performance', getSlidesPerformance())
      console.log('...cumulative drive cache performance', getDrivePerformance())
    }
  });


  // Cleanup created presentations
  trasher(toTrash);

  if (!pack) {
    unit.report();
  }

  return { unit, fixes };
};

if (ScriptApp.isFake && globalThis.process?.argv.slice(2).includes("execute")) {
  testSlides();
  ScriptApp.__behavior.trash()
  console.log('...cumulative slides cache performance', getSlidesPerformance())
  console.log('...cumulative drive cache performance', getDrivePerformance())
}