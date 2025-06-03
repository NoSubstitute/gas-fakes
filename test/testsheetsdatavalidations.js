
// all these imports 
// this is loaded by npm, but is a library on Apps Script side

import '../main.js'

// all the fake services are here
//import '@mcpher/gas-fakes/main.js'

import { initTests } from './testinit.js'
import { getSheetsPerformance } from '../src/support/sheetscache.js';
import { getPerformance } from '../src/support/filecache.js';
import { maketss, trasher } from './testassist.js';

import is from '@sindresorhus/is';

// this can run standalone, or as part of combined tests if result of inittests is passed over
export const testSheetsDataValidations = (pack) => {

  const { unit, fixes } = pack || initTests()
  const toTrash = []

  // for debugging
  const noisy = false
  const zeroizeTime = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // Month is 0-indexed
    const day = date.getDate();
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const addDays = (date, daysToAdd = 1) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + daysToAdd);
    return newDate;
  }
  const isRange = (a) => is.object(a) && !is.null(a) && is.function(a.toString) && a.toString() === "Range"
  const isEnum = (a) => is.object(a) && Reflect.has(a, "compareTo") && is.function(a.compareTo)
  const bothEnums = (a, b) => isEnum(a) && isEnum(b)
  const rangeFix = (a) => isRange(a) ? `=${a.getSheet().getName()}!${a.getA1Notation()}` : a
  const valuesFix = (a) => is.array(a) ? a.map (stringer) : stringer(a)
  const stringer = (a) => is.null(a) || is.undefined(a) 
    ? a 
    : (isRange(a) ? rangeFix(a) : (is.function (a.toString) ? a.toString() : a))

  const compareValue = (t, a, b, prop) => {
    if (bothEnums(a, b)) {
      t.is(a.compareTo(b), 0,prop)
      t.is(a.toString(), b.toString(),prop)
    } else {
      t.deepEqual(valuesFix(a), valuesFix(b),prop)
    }
  }

  // how many dimensions the values array has
  const getDimensions = (v) => {
    let dims = 0
    while (is.array(v)) {
      dims++
      v = v[0]
    }
    return dims
  }

  const critty = (t, sb, range, prop, values) => {
    const cr = sb.getRange(range)
    const cb = cr.getDataValidation()
    t.is(cb.getCriteriaType().toString(), prop)
    const cbs = cr.getDataValidations()
    t.true(cbs.flat().every(f => f.getCriteriaType().toString() === prop))
    t.is(cbs.length, cr.getNumRows(), prop)
    t.is(cbs[0].length, cr.getNumColumns(),prop)
    t.true(cbs.flat().every(f => is.boolean(f.getAllowInvalid())), prop)

    if (values) {
      const flatv = values.flat()
      cbs.flat().forEach((f, i) => compareValue(t, f.getCriteriaValues()[0], flatv[flatv.length === 1 ? 0 : i]))
    }
  }

  const scritty = (t, sb, range, prop, method, values = [], argsAreArrays = false) => {
    if (noisy) console.log("scritty", prop, method, range)
    const cr = sb.getRange(range)
    const nr = cr.getNumRows()
    const nc = cr.getNumColumns()

    // create empty crieria and data validation
    const nv = SpreadsheetApp.newDataValidation()
    const crit = SpreadsheetApp.DataValidationCriteria[prop]

    let dims = getDimensions(values)
    // because we dont want to consider argarrays as a dimension
    if (argsAreArrays) dims--
    if (dims < 1) throw new Error(`expected at least 1 dimension for values`)

    // check basic results are as expected
    const check = () => {
      const cbs = cr.getDataValidations()
      t.is(cbs.length, cr.getNumRows(),prop)
      t.is(cbs[0].length, cr.getNumColumns(),prop)
      t.true(cbs.flat().every(f => f.getCriteriaType().toString() === prop),prop)
      const cb = cr.getDataValidation()
      t.is(cb.getCriteriaType().toString(), prop)
    }

    // apply the same args to each element of the range
    if (dims === 1) {
      const built = method ? nv[method](...values).build() : nv.withCriteria(crit, values).build()
      if (noisy) console.log('built dv', cr.getA1Notation(), 'dimensions', dims)
      cr.setDataValidation(built)
      const cb = cr.getDataValidation()
      t.is(cb.getCriteriaType().toString(), prop)
      compareValue(t, cb.getCriteriaValues(), values, prop)
      return check()
    }

    // separate values to each item of the range
    if (dims !== 3) {
      throw new Error(`expected 1 or 3 dimensionsfor values - got ${dims}`)
    }
    // create multiple validations to match the domensions of the range

    if (nr !== values.length && !argsAreArrays) {
      throw new Error(`expected values to be same length as range - got ${values.length} rows}`)
    }


    const dv = values.map(row => {
      if (!is.array(row) || row.length !== nc) {
        throw new Error(`expected values to be arrays of the same length as the number of columns - got ${row && row.length}`)
      }
      return row.map(col => {
        if (!is.array(col)) throw new Error(`expected value args to be arrays - got ${col}`)
        const nv = SpreadsheetApp.newDataValidation()
        return method ? nv[method](...col).build() : nv.withCriteria(crit, col).build()
      })
    })
    if (noisy) console.log('built dv - multiple values for', cr.getA1Notation(), dv.length, ' rows')
    cr.setDataValidations(dv)
    const cbs = cr.getDataValidations()
    const flatv = values.flat(1)

    cbs.flat(1).forEach((f, i) => {
      let v = f.getCriteriaValues()
      compareValue(t, v, flatv[i], prop)
    })
    check()
  }




  unit.section("test enum selection", t => {
    t.is(SpreadsheetApp.DataValidationCriteria.DATE_AFTER.toString(), 'DATE_AFTER', "check criteria enum")
    t.is(SpreadsheetApp.RelativeDate.TODAY.toString(), 'TODAY', "check relative dates")
    t.is(SpreadsheetApp.ProtectionType.SHEET.toString(), 'SHEET')
    t.is(SpreadsheetApp.DataValidationCriteria.DATE_BEFORE.toString(), 'DATE_BEFORE', "check criteria enum")
    t.is(SpreadsheetApp.DataValidationCriteria.DATE_AFTER_RELATIVE.toString(), 'DATE_AFTER_RELATIVE', "check relative criteria enum")
  })


  unit.section("getting relative dates and formulas with requires - these can only be set by the UI", t => {
    const sp = SpreadsheetApp.openById(fixes.TEST_BORDERS_ID)
    const sb = sp.getSheetByName('dv')

    
    critty(t, sb, "b29", "DATE_EQUAL_TO_RELATIVE", [SpreadsheetApp.RelativeDate.TODAY])
    critty(t, sb, "h28:i28", "DATE_AFTER_RELATIVE", [SpreadsheetApp.RelativeDate.TOMORROW])
    critty(t, sb, "k28:k29", "DATE_BEFORE_RELATIVE", [SpreadsheetApp.RelativeDate.PAST_YEAR])

    // what if value is a formula
    critty(t, sb, "g24", "DATE_EQUAL_TO", ['=I1'])
    critty(t, sb, "f24", "TEXT_CONTAINS", ['=F7'])
    if (SpreadsheetApp.isFake) console.log('...cumulative sheets cache performance', getSheetsPerformance())
  })

  unit.section("data validation basics", t => {
    const {sheet: sv} = maketss ('datavalidation',toTrash, fixes)

    const builder = SpreadsheetApp.newDataValidation()
    t.is(builder.toString(), "DataValidationBuilder")
    t.is(builder.getCriteriaType(), null)
    t.deepEqual(builder.getCriteriaValues(), [])
    t.is(builder.getHelpText(), null)

    t.is(builder.getAllowInvalid(), true)
    t.is(builder.setAllowInvalid(false).getAllowInvalid(), false)
    t.is(builder.setAllowInvalid(true).getAllowInvalid(), true)

    t.is(builder.requireCheckbox().getCriteriaType().toString(), "CHECKBOX")
    t.deepEqual(builder.getCriteriaValues(), [])
    t.deepEqual(builder.requireCheckbox("A").getCriteriaValues(), ["A"])
    t.is(builder.requireCheckbox().getCriteriaType().toString(), "CHECKBOX")
    t.deepEqual(builder.requireCheckbox("A", "B").getCriteriaValues(), ["A", "B"])
    t.is(builder.getCriteriaType().toString(), "CHECKBOX")

    t.is(builder.setHelpText("foo").getHelpText(), "foo")


    const built = builder.build()
    t.is(built.toString(), "DataValidation")
    t.is(built.getCriteriaType().toString(), "CHECKBOX")
    t.deepEqual(built.getCriteriaValues(), ["A", "B"])
    t.is(built.getAllowInvalid(), true)
    t.is(built.getHelpText(), "foo")

    const dateTests = (method, prop, nargs) => {
      const now = zeroizeTime(new Date())
      const later = zeroizeTime(addDays(now))
      const args = [now, later].slice(0, nargs)
      const builder = SpreadsheetApp.newDataValidation()[method](...args)
      const built = builder.build()
      t.is(built.getCriteriaType().toString(), prop)
      t.deepEqual(built.getCriteriaValues().map(f => f.toISOString()), args.map(f => f.toISOString()), prop)
    }

    dateTests("requireDate", "DATE_IS_VALID_DATE", 0)
    dateTests("requireDateAfter", "DATE_AFTER", 1)
    dateTests("requireDateBefore", "DATE_BEFORE", 1)
    dateTests("requireDateBetween", "DATE_BETWEEN", 2)
    dateTests("requireDateEqualTo", "DATE_EQUAL_TO", 1)
    dateTests("requireDateNotBetween", "DATE_NOT_BETWEEN", 2)
    dateTests("requireDateOnOrBefore", "DATE_ON_OR_BEFORE", 1)
    dateTests("requireDateOnOrAfter", "DATE_ON_OR_AFTER", 1)

    const built2 = SpreadsheetApp.newDataValidation().requireFormulaSatisfied("=ISNUMBER(A1)").build()
    t.is(built2.getCriteriaType().toString(), "CUSTOM_FORMULA")
    t.deepEqual(built2.getCriteriaValues(), ["=ISNUMBER(A1)"])

    const basicTests = (method, prop, nargs, maker) => {
      maker = maker || (() => (Math.random() * 100).toString())
      const args = Array.from({ length: nargs }).map((f, i) => maker(f, i))
      const builder = SpreadsheetApp.newDataValidation()[method](...args)
      const built = builder.build()
      t.is(built.getCriteriaType().toString(), prop)
      t.deepEqual(built.getCriteriaValues(), args, prop)
    }

    const numberTests = (...args) => basicTests(...args, () => Math.random() * 100)


    numberTests("requireNumberBetween", "NUMBER_BETWEEN", 2)
    numberTests("requireNumberEqualTo", "NUMBER_EQUAL_TO", 1)
    numberTests("requireNumberGreaterThan", "NUMBER_GREATER_THAN", 1)
    numberTests("requireNumberGreaterThanOrEqualTo", "NUMBER_GREATER_THAN_OR_EQUAL_TO", 1)
    numberTests("requireNumberLessThan", "NUMBER_LESS_THAN", 1)
    numberTests("requireNumberLessThanOrEqualTo", "NUMBER_LESS_THAN_OR_EQUAL_TO", 1)
    numberTests("requireNumberNotBetween", "NUMBER_NOT_BETWEEN", 2)
    numberTests("requireNumberNotEqualTo", "NUMBER_NOT_EQUAL_TO", 1)


    basicTests("requireTextContains", "TEXT_CONTAINS", 1)
    basicTests("requireTextDoesNotContain", "TEXT_DOES_NOT_CONTAIN", 1)
    basicTests("requireTextEqualTo", "TEXT_EQUAL_TO", 1)
    basicTests("requireTextIsEmail", "TEXT_IS_VALID_EMAIL", 0)
    basicTests("requireTextIsUrl", "TEXT_IS_VALID_URL", 0)

    // note that apps script converts everything to strings in a value list
    basicTests("requireValueInList", "VALUE_IN_LIST", 2, (_, i) => !i ? ["a", "false", "2", "c"] : true)

    // we have to do a special test for this because GAS shoves in a default argument for showDropDown and converts values to strings
    const vl = [9, false, "z"]
    const bv2 = SpreadsheetApp.newDataValidation().requireValueInList(vl)
    t.is(bv2.getCriteriaType().toString(), "VALUE_IN_LIST")
    t.deepEqual(bv2.getCriteriaValues(), [vl.map(f => f.toString()), true])

    const vr = sv.getRange("A2:C4")
    const bv3 = SpreadsheetApp.newDataValidation().requireValueInRange(vr)
    t.is(bv3.getCriteriaType().toString(), "VALUE_IN_RANGE")
    t.deepEqual(bv3.getCriteriaValues()[0].getA1Notation(), vr.getA1Notation())
    t.is(bv3.getCriteriaValues()[1], true)

    const bv4 = SpreadsheetApp.newDataValidation()
    bv4.requireValueInRange(vr, false)
    t.is(bv4.getCriteriaType().toString(), "VALUE_IN_RANGE")
    t.deepEqual(bv4.getCriteriaValues()[0].getA1Notation(), vr.getA1Notation())
    t.is(bv4.getCriteriaValues()[1], false)

    const b2 = builder.copy()
    t.is(b2.toString(), "DataValidationBuilder")

    if (SpreadsheetApp.isFake) console.log('...cumulative sheets cache performance', getSheetsPerformance())
  })

  unit.section("setting data validations", t => {

    const {sheet: sb} = maketss ('datavalidation',toTrash, fixes)

    const da = new Date('1920-11-18')
    const db = new Date('2012-12-31')


    const comp = [
      [[[1,2],true],[[3,4,5],false],[[6,7],true]],
      [[['a','b'],false],[['c','d','e'],true],[['f','g'],false]]
    ]
    scritty(t, sb, "e19:g20", "VALUE_IN_LIST", "requireValueInList", comp, true)
    scritty(t, sb, "c19:e19", "VALUE_IN_LIST", "requireValueInList", [["foo", "bar", "foobar"],true], true)

    scritty(t, sb, "a19:b19", "VALUE_IN_RANGE", "requireValueInRange", [sb.getRange("$a$1:$b$3"), false])
    scritty(t, sb, "a19:b19", "VALUE_IN_RANGE", "requireValueInRange", [sb.getRange("$a$1:$b$3"), true])

    scritty(t, sb, "c15:e16", "DATE_BETWEEN", "requireDateBetween", [[[da, db], [db, db], [da, da]], [[da, da], [db, db], [da, db]]])
    scritty(t, sb, "a15:b15", "DATE_IS_VALID_DATE", "requireDate")

    scritty(t, sb, "a17:b17", "TEXT_CONTAINS", "requireTextContains", ["foo"])
    scritty(t, sb, "c17:d17", "TEXT_DOES_NOT_CONTAIN", "requireTextDoesNotContain", ["bar"])
    scritty(t, sb, "e17:f17", "TEXT_IS_VALID_URL", "requireTextIsUrl")


    const vt = [[['foo'], ['bar']], [['bar'], ['foo']]]
    scritty(t, sb, "a1:b2", "TEXT_EQUAL_TO", 'requireTextEqualTo', vt)
    scritty(t, sb, "c1:d2", "CHECKBOX", 'requireCheckbox')
    scritty(t, sb, "e1:f2", "CHECKBOX", 'requireCheckbox', ['foo', 'bar'])

    scritty(t, sb, "a3", "CUSTOM_FORMULA", 'requireFormulaSatisfied', ["=F7"])
    scritty(t, sb, "c3:d4", "CUSTOM_FORMULA", 'requireFormulaSatisfied', ["=Sheet1!$F$7:$F$8"])

    scritty(t, sb, "a5:b6", "NUMBER_NOT_BETWEEN", "requireNumberNotBetween", [20, 40])
    scritty(t, sb, "c5", "NUMBER_BETWEEN", "requireNumberBetween", [20, 40])
    scritty(t, sb, "e5:f6", "NUMBER_NOT_EQUAL_TO", "requireNumberNotEqualTo", [20])

    scritty(t, sb, "a7:b8", "NUMBER_EQUAL_TO", "requireNumberEqualTo", [20])
    scritty(t, sb, "c7:d8", "NUMBER_LESS_THAN_OR_EQUAL_TO", "requireNumberLessThanOrEqualTo", [20])
    scritty(t, sb, "e7:f8", "NUMBER_LESS_THAN", "requireNumberLessThan", [20])

    scritty(t, sb, "a9:b10", "NUMBER_GREATER_THAN_OR_EQUAL_TO", "requireNumberGreaterThanOrEqualTo", [20])
    scritty(t, sb, "c9:d10", "NUMBER_GREATER_THAN", "requireNumberGreaterThan", [20])
    scritty(t, sb, "e9:f10", "NUMBER_BETWEEN", "requireNumberBetween", [[[20, 40], [30, 40]], [[50, 60], [70, 80]]])


    scritty(t, sb, "a11:b11", "DATE_NOT_BETWEEN", "requireDateNotBetween", [da, db])
    scritty(t, sb, "c11:d11", "DATE_BETWEEN", "requireDateBetween", [da, db])
    scritty(t, sb, "e11:f11", "DATE_ON_OR_AFTER", "requireDateOnOrAfter", [da])

    scritty(t, sb, "a13:b13", "DATE_ON_OR_BEFORE", "requireDateOnOrBefore", [da])
    scritty(t, sb, "c13:d13", "DATE_BEFORE", "requireDateBefore", [da])
    scritty(t, sb, "e13:f13", "DATE_EQUAL_TO", "requireDateEqualTo", [db])

    scritty(t, sb, "a15:b15", "DATE_AFTER", "requireDateAfter", [da])

    if (SpreadsheetApp.isFake) console.log('...cumulative sheets cache performance', getSheetsPerformance())

  })
  












  // running standalone
  if (!pack) {
    if (Drive.isFake) console.log('...cumulative drive cache performance', getPerformance())
    if (SpreadsheetApp.isFake) console.log('...cumulative sheets cache performance', getSheetsPerformance())
    unit.report()

  }

  trasher(toTrash)
  return { unit, fixes }
}

// if we're running this test standalone, on Node - we need to actually kick it off
// the provess.argv should contain "execute" 
// for example node testdrive.js execute
// on apps script we don't want it to run automatically
// when running as part of a consolidated test, we dont want to run it, as the caller will do that

if (ScriptApp.isFake && globalThis.process?.argv.slice(2).includes("execute")) testSheetsDataValidations()
