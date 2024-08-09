"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/graphql-tag";
exports.ids = ["vendor-chunks/graphql-tag"];
exports.modules = {

/***/ "(ssr)/./node_modules/graphql-tag/lib/index.js":
/*!***********************************************!*\
  !*** ./node_modules/graphql-tag/lib/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   disableExperimentalFragmentVariables: () => (/* binding */ disableExperimentalFragmentVariables),\n/* harmony export */   disableFragmentWarnings: () => (/* binding */ disableFragmentWarnings),\n/* harmony export */   enableExperimentalFragmentVariables: () => (/* binding */ enableExperimentalFragmentVariables),\n/* harmony export */   gql: () => (/* binding */ gql),\n/* harmony export */   resetCaches: () => (/* binding */ resetCaches)\n/* harmony export */ });\n/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ \"(ssr)/./node_modules/tslib/tslib.es6.mjs\");\n/* harmony import */ var graphql__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! graphql */ \"(ssr)/./node_modules/graphql/language/parser.mjs\");\n\n\nvar docCache = new Map();\nvar fragmentSourceMap = new Map();\nvar printFragmentWarnings = true;\nvar experimentalFragmentVariables = false;\nfunction normalize(string) {\n    return string.replace(/[\\s,]+/g, ' ').trim();\n}\nfunction cacheKeyFromLoc(loc) {\n    return normalize(loc.source.body.substring(loc.start, loc.end));\n}\nfunction processFragments(ast) {\n    var seenKeys = new Set();\n    var definitions = [];\n    ast.definitions.forEach(function (fragmentDefinition) {\n        if (fragmentDefinition.kind === 'FragmentDefinition') {\n            var fragmentName = fragmentDefinition.name.value;\n            var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);\n            var sourceKeySet = fragmentSourceMap.get(fragmentName);\n            if (sourceKeySet && !sourceKeySet.has(sourceKey)) {\n                if (printFragmentWarnings) {\n                    console.warn(\"Warning: fragment with name \" + fragmentName + \" already exists.\\n\"\n                        + \"graphql-tag enforces all fragment names across your application to be unique; read more about\\n\"\n                        + \"this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names\");\n                }\n            }\n            else if (!sourceKeySet) {\n                fragmentSourceMap.set(fragmentName, sourceKeySet = new Set);\n            }\n            sourceKeySet.add(sourceKey);\n            if (!seenKeys.has(sourceKey)) {\n                seenKeys.add(sourceKey);\n                definitions.push(fragmentDefinition);\n            }\n        }\n        else {\n            definitions.push(fragmentDefinition);\n        }\n    });\n    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, ast), { definitions: definitions });\n}\nfunction stripLoc(doc) {\n    var workSet = new Set(doc.definitions);\n    workSet.forEach(function (node) {\n        if (node.loc)\n            delete node.loc;\n        Object.keys(node).forEach(function (key) {\n            var value = node[key];\n            if (value && typeof value === 'object') {\n                workSet.add(value);\n            }\n        });\n    });\n    var loc = doc.loc;\n    if (loc) {\n        delete loc.startToken;\n        delete loc.endToken;\n    }\n    return doc;\n}\nfunction parseDocument(source) {\n    var cacheKey = normalize(source);\n    if (!docCache.has(cacheKey)) {\n        var parsed = (0,graphql__WEBPACK_IMPORTED_MODULE_1__.parse)(source, {\n            experimentalFragmentVariables: experimentalFragmentVariables,\n            allowLegacyFragmentVariables: experimentalFragmentVariables\n        });\n        if (!parsed || parsed.kind !== 'Document') {\n            throw new Error('Not a valid GraphQL document.');\n        }\n        docCache.set(cacheKey, stripLoc(processFragments(parsed)));\n    }\n    return docCache.get(cacheKey);\n}\nfunction gql(literals) {\n    var args = [];\n    for (var _i = 1; _i < arguments.length; _i++) {\n        args[_i - 1] = arguments[_i];\n    }\n    if (typeof literals === 'string') {\n        literals = [literals];\n    }\n    var result = literals[0];\n    args.forEach(function (arg, i) {\n        if (arg && arg.kind === 'Document') {\n            result += arg.loc.source.body;\n        }\n        else {\n            result += arg;\n        }\n        result += literals[i + 1];\n    });\n    return parseDocument(result);\n}\nfunction resetCaches() {\n    docCache.clear();\n    fragmentSourceMap.clear();\n}\nfunction disableFragmentWarnings() {\n    printFragmentWarnings = false;\n}\nfunction enableExperimentalFragmentVariables() {\n    experimentalFragmentVariables = true;\n}\nfunction disableExperimentalFragmentVariables() {\n    experimentalFragmentVariables = false;\n}\nvar extras = {\n    gql: gql,\n    resetCaches: resetCaches,\n    disableFragmentWarnings: disableFragmentWarnings,\n    enableExperimentalFragmentVariables: enableExperimentalFragmentVariables,\n    disableExperimentalFragmentVariables: disableExperimentalFragmentVariables\n};\n(function (gql_1) {\n    gql_1.gql = extras.gql, gql_1.resetCaches = extras.resetCaches, gql_1.disableFragmentWarnings = extras.disableFragmentWarnings, gql_1.enableExperimentalFragmentVariables = extras.enableExperimentalFragmentVariables, gql_1.disableExperimentalFragmentVariables = extras.disableExperimentalFragmentVariables;\n})(gql || (gql = {}));\ngql[\"default\"] = gql;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (gql);\n//# sourceMappingURL=index.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ3JhcGhxbC10YWcvbGliL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQWlDO0FBQ0Q7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUdBQXlHO0FBQ3pHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxXQUFXLCtDQUFRLENBQUMsK0NBQVEsR0FBRyxVQUFVLDBCQUEwQjtBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQiw4Q0FBSztBQUMxQjtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLGtCQUFrQjtBQUNuQjtBQUNBLGlFQUFlLEdBQUcsRUFBQztBQUNuQiIsInNvdXJjZXMiOlsid2VicGFjazovL2RvcGUtbHlyaWNzLy4vbm9kZV9tb2R1bGVzL2dyYXBocWwtdGFnL2xpYi9pbmRleC5qcz8wNDY1Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IF9fYXNzaWduIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ2dyYXBocWwnO1xudmFyIGRvY0NhY2hlID0gbmV3IE1hcCgpO1xudmFyIGZyYWdtZW50U291cmNlTWFwID0gbmV3IE1hcCgpO1xudmFyIHByaW50RnJhZ21lbnRXYXJuaW5ncyA9IHRydWU7XG52YXIgZXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXMgPSBmYWxzZTtcbmZ1bmN0aW9uIG5vcm1hbGl6ZShzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1tcXHMsXSsvZywgJyAnKS50cmltKCk7XG59XG5mdW5jdGlvbiBjYWNoZUtleUZyb21Mb2MobG9jKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShsb2Muc291cmNlLmJvZHkuc3Vic3RyaW5nKGxvYy5zdGFydCwgbG9jLmVuZCkpO1xufVxuZnVuY3Rpb24gcHJvY2Vzc0ZyYWdtZW50cyhhc3QpIHtcbiAgICB2YXIgc2VlbktleXMgPSBuZXcgU2V0KCk7XG4gICAgdmFyIGRlZmluaXRpb25zID0gW107XG4gICAgYXN0LmRlZmluaXRpb25zLmZvckVhY2goZnVuY3Rpb24gKGZyYWdtZW50RGVmaW5pdGlvbikge1xuICAgICAgICBpZiAoZnJhZ21lbnREZWZpbml0aW9uLmtpbmQgPT09ICdGcmFnbWVudERlZmluaXRpb24nKSB7XG4gICAgICAgICAgICB2YXIgZnJhZ21lbnROYW1lID0gZnJhZ21lbnREZWZpbml0aW9uLm5hbWUudmFsdWU7XG4gICAgICAgICAgICB2YXIgc291cmNlS2V5ID0gY2FjaGVLZXlGcm9tTG9jKGZyYWdtZW50RGVmaW5pdGlvbi5sb2MpO1xuICAgICAgICAgICAgdmFyIHNvdXJjZUtleVNldCA9IGZyYWdtZW50U291cmNlTWFwLmdldChmcmFnbWVudE5hbWUpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZUtleVNldCAmJiAhc291cmNlS2V5U2V0Lmhhcyhzb3VyY2VLZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByaW50RnJhZ21lbnRXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJXYXJuaW5nOiBmcmFnbWVudCB3aXRoIG5hbWUgXCIgKyBmcmFnbWVudE5hbWUgKyBcIiBhbHJlYWR5IGV4aXN0cy5cXG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImdyYXBocWwtdGFnIGVuZm9yY2VzIGFsbCBmcmFnbWVudCBuYW1lcyBhY3Jvc3MgeW91ciBhcHBsaWNhdGlvbiB0byBiZSB1bmlxdWU7IHJlYWQgbW9yZSBhYm91dFxcblwiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwidGhpcyBpbiB0aGUgZG9jczogaHR0cDovL2Rldi5hcG9sbG9kYXRhLmNvbS9jb3JlL2ZyYWdtZW50cy5odG1sI3VuaXF1ZS1uYW1lc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghc291cmNlS2V5U2V0KSB7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnRTb3VyY2VNYXAuc2V0KGZyYWdtZW50TmFtZSwgc291cmNlS2V5U2V0ID0gbmV3IFNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VLZXlTZXQuYWRkKHNvdXJjZUtleSk7XG4gICAgICAgICAgICBpZiAoIXNlZW5LZXlzLmhhcyhzb3VyY2VLZXkpKSB7XG4gICAgICAgICAgICAgICAgc2VlbktleXMuYWRkKHNvdXJjZUtleSk7XG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbnMucHVzaChmcmFnbWVudERlZmluaXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVmaW5pdGlvbnMucHVzaChmcmFnbWVudERlZmluaXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIF9fYXNzaWduKF9fYXNzaWduKHt9LCBhc3QpLCB7IGRlZmluaXRpb25zOiBkZWZpbml0aW9ucyB9KTtcbn1cbmZ1bmN0aW9uIHN0cmlwTG9jKGRvYykge1xuICAgIHZhciB3b3JrU2V0ID0gbmV3IFNldChkb2MuZGVmaW5pdGlvbnMpO1xuICAgIHdvcmtTZXQuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5sb2MpXG4gICAgICAgICAgICBkZWxldGUgbm9kZS5sb2M7XG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gbm9kZVtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICB3b3JrU2V0LmFkZCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHZhciBsb2MgPSBkb2MubG9jO1xuICAgIGlmIChsb2MpIHtcbiAgICAgICAgZGVsZXRlIGxvYy5zdGFydFRva2VuO1xuICAgICAgICBkZWxldGUgbG9jLmVuZFRva2VuO1xuICAgIH1cbiAgICByZXR1cm4gZG9jO1xufVxuZnVuY3Rpb24gcGFyc2VEb2N1bWVudChzb3VyY2UpIHtcbiAgICB2YXIgY2FjaGVLZXkgPSBub3JtYWxpemUoc291cmNlKTtcbiAgICBpZiAoIWRvY0NhY2hlLmhhcyhjYWNoZUtleSkpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlKHNvdXJjZSwge1xuICAgICAgICAgICAgZXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXM6IGV4cGVyaW1lbnRhbEZyYWdtZW50VmFyaWFibGVzLFxuICAgICAgICAgICAgYWxsb3dMZWdhY3lGcmFnbWVudFZhcmlhYmxlczogZXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXNcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcGFyc2VkIHx8IHBhcnNlZC5raW5kICE9PSAnRG9jdW1lbnQnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIEdyYXBoUUwgZG9jdW1lbnQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jQ2FjaGUuc2V0KGNhY2hlS2V5LCBzdHJpcExvYyhwcm9jZXNzRnJhZ21lbnRzKHBhcnNlZCkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvY0NhY2hlLmdldChjYWNoZUtleSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ3FsKGxpdGVyYWxzKSB7XG4gICAgdmFyIGFyZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxpdGVyYWxzID09PSAnc3RyaW5nJykge1xuICAgICAgICBsaXRlcmFscyA9IFtsaXRlcmFsc107XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBsaXRlcmFsc1swXTtcbiAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24gKGFyZywgaSkge1xuICAgICAgICBpZiAoYXJnICYmIGFyZy5raW5kID09PSAnRG9jdW1lbnQnKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYXJnLmxvYy5zb3VyY2UuYm9keTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBhcmc7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IGxpdGVyYWxzW2kgKyAxXTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VEb2N1bWVudChyZXN1bHQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q2FjaGVzKCkge1xuICAgIGRvY0NhY2hlLmNsZWFyKCk7XG4gICAgZnJhZ21lbnRTb3VyY2VNYXAuY2xlYXIoKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlRnJhZ21lbnRXYXJuaW5ncygpIHtcbiAgICBwcmludEZyYWdtZW50V2FybmluZ3MgPSBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVFeHBlcmltZW50YWxGcmFnbWVudFZhcmlhYmxlcygpIHtcbiAgICBleHBlcmltZW50YWxGcmFnbWVudFZhcmlhYmxlcyA9IHRydWU7XG59XG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUV4cGVyaW1lbnRhbEZyYWdtZW50VmFyaWFibGVzKCkge1xuICAgIGV4cGVyaW1lbnRhbEZyYWdtZW50VmFyaWFibGVzID0gZmFsc2U7XG59XG52YXIgZXh0cmFzID0ge1xuICAgIGdxbDogZ3FsLFxuICAgIHJlc2V0Q2FjaGVzOiByZXNldENhY2hlcyxcbiAgICBkaXNhYmxlRnJhZ21lbnRXYXJuaW5nczogZGlzYWJsZUZyYWdtZW50V2FybmluZ3MsXG4gICAgZW5hYmxlRXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXM6IGVuYWJsZUV4cGVyaW1lbnRhbEZyYWdtZW50VmFyaWFibGVzLFxuICAgIGRpc2FibGVFeHBlcmltZW50YWxGcmFnbWVudFZhcmlhYmxlczogZGlzYWJsZUV4cGVyaW1lbnRhbEZyYWdtZW50VmFyaWFibGVzXG59O1xuKGZ1bmN0aW9uIChncWxfMSkge1xuICAgIGdxbF8xLmdxbCA9IGV4dHJhcy5ncWwsIGdxbF8xLnJlc2V0Q2FjaGVzID0gZXh0cmFzLnJlc2V0Q2FjaGVzLCBncWxfMS5kaXNhYmxlRnJhZ21lbnRXYXJuaW5ncyA9IGV4dHJhcy5kaXNhYmxlRnJhZ21lbnRXYXJuaW5ncywgZ3FsXzEuZW5hYmxlRXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXMgPSBleHRyYXMuZW5hYmxlRXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXMsIGdxbF8xLmRpc2FibGVFeHBlcmltZW50YWxGcmFnbWVudFZhcmlhYmxlcyA9IGV4dHJhcy5kaXNhYmxlRXhwZXJpbWVudGFsRnJhZ21lbnRWYXJpYWJsZXM7XG59KShncWwgfHwgKGdxbCA9IHt9KSk7XG5ncWxbXCJkZWZhdWx0XCJdID0gZ3FsO1xuZXhwb3J0IGRlZmF1bHQgZ3FsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/graphql-tag/lib/index.js\n");

/***/ })

};
;