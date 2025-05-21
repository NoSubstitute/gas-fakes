
// all these imports 
// this is loaded by npm, but is a library on Apps Script side

import '../main.js'

// all the fake services are here
//import '@mcpher/gas-fakes/main.js'

import { initTests } from './testinit.js'
import { getSheetsPerformance } from '../src/support/sheetscache.js';
import {  trasher  } from './testassist.js';
import is from '@sindresorhus/is';

// this can run standalone, or as part of combined tests if result of inittests is passed over
export const testEnums = (pack) => {

  const { unit, fixes } = pack || initTests()
  const toTrash = []

  unit.section("check enums", t => {

    const testEnumProp = (prop) => {
      const p = SpreadsheetApp[prop]
      t.true(is.nonEmptyObject(p))
      Object.keys (p).filter(is.object).forEach ((key,i) => {
        t.true(is.nonEmptyObject(p[key]))
        t.is (p[key].toString(), key)
        t.is (p[key].name(), key)
        t.is (p[key].ordinal(),i)
        t.is (p[key].compareTo(p[key]), 0)
        if (!i) {
          t.is (p[key].name(), p.name())
        } else {
          t.not(p[key].compareTo(p.name(), 0))
        }
      })
      
    }
    // test that all directly accessible enums work
    const enumProps = [
      "AutoFillSeries", //	AutoFillSeries	An enumeration of the types of series used to calculate auto-filled values.
      "BandingTheme", //	BandingTheme	An enumeration of the possible banding themes.
      "BooleanCriteria", //	BooleanCriteria	An enumeration of conditional formatting boolean criteria.
      "BorderStyle", //	BorderStyle	An enumeration of the valid styles for setting borders on a Range.
      "ColorType", //	ColorType	An enumeration of possible color types.
      "CopyPasteType", //	CopyPasteType	An enumeration of the possible paste types.
      "DataExecutionErrorCode", //	DataExecutionErrorCode	An enumeration of the possible data execution error codes.
      "DataExecutionState", //	DataExecutionState	An enumeration of the possible data execution states.
      "DataSourceParameterType", //	DataSourceParameterType	An enumeration of the possible data source parameter types.
      "DataSourceRefreshScope", //	DataSourceRefreshScope	An enumeration of possible data source refresh scopes.
      "DataSourceType", //	DataSourceType	An enumeration of the possible data source types.
      "DataValidationCriteria", //	DataValidationCriteria	An enumeration representing the data validation criteria that can be set on a range.
      "DateTimeGroupingRuleType", //	DateTimeGroupingRuleType	An enumeration of date time grouping rule.
      "DeveloperMetadataLocationType", //	DeveloperMetadataLocationType	An enumeration of possible developer metadata location types.
      "DeveloperMetadataVisibility", //	DeveloperMetadataVisibility	An enumeration of the possible developer metadata visibilities.
      "Dimension", //	Dimension	An enumeration of the possible dimensions of a spreadsheet.
      "Direction", //	Direction	A enumeration of the possible directions that one can move within a spreadsheet using the arrow keys.
      "FrequencyType", //	FrequencyType	An enumeration of possible frequency types.
      "GroupControlTogglePosition", //	GroupControlTogglePosition	An enumeration of the positions that the group control toggle can be in.
      "InterpolationType", //	InterpolationType	An enumeration of conditional format gradient interpolation types.
      "PivotTableSummarizeFunction", //	PivotTableSummarizeFunction	An enumeration of the functions that may be used to summarize values in a pivot table.
      "PivotValueDisplayType", //	PivotValueDisplayType	An enumeration of the ways that a pivot value may be displayed.
      "ProtectionType", //	ProtectionType	An enumeration representing the parts of a spreadsheet that can be protected from edits.
      "RecalculationInterval", //	RecalculationInterval	An enumeration of the possible intervals that can be used in spreadsheet recalculation.
      "RelativeDate", //	RelativeDate	An enumeration of relative date options for calculating a value to be used in date-based BooleanCriteria.
      "SheetType", //	SheetType	An enumeration of the different types of sheets that can exist in a spreadsheet.
      "SortOrder", //	SortOrder	An enumeration of sort order.
      "TextDirection", //	TextDirection	An enumeration of valid text directions.
      "TextToColumnsDelimiter", //	TextToColumnsDelimiter	An enumeration of the preset delimiters for split text to columns.
      "ThemeColorType", //	ThemeColorType	An enumeration of possible theme color types.
      "ValueType", //	ValueType	An enumeration of value types returned by Range.getValue() and Range.getValues() from the Range class of the Spreadsheet service. The enumeration values listed below are in addition to Number, Boolean, Date, or String.
      "WrapStrategy", //	WrapStrategy	An enumeration of the strategies used for wrapping cells.  
    ]

    enumProps.forEach(testEnumProp)
  })


  

  // running standalone
  if (!pack) {
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

if (ScriptApp.isFake && globalThis.process?.argv.slice(2).includes("execute")) testEnums()
