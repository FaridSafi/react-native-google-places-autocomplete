'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _jsxFileName='src/GooglePlacesAutocomplete.js';var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _react=require('react');var _react2=_interopRequireDefault(_react);
var _propTypes=require('prop-types');var _propTypes2=_interopRequireDefault(_propTypes);
var _reactNative=require('react-native');













var _qs=require('qs');var _qs2=_interopRequireDefault(_qs);
var _lodash=require('lodash.debounce');var _lodash2=_interopRequireDefault(_lodash);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _objectWithoutProperties(obj,keys){var target={};for(var i in obj){if(keys.indexOf(i)>=0)continue;if(!Object.prototype.hasOwnProperty.call(obj,i))continue;target[i]=obj[i];}return target;}function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}

var WINDOW=_reactNative.Dimensions.get('window');

var defaultStyles={
container:{
flex:1},

textInputContainer:{
backgroundColor:'#C9C9CE',
height:44,
borderTopColor:'#7e7e7e',
borderBottomColor:'#b5b5b5',
borderTopWidth:1/_reactNative.PixelRatio.get(),
borderBottomWidth:1/_reactNative.PixelRatio.get(),
flexDirection:'row'},

textInput:{
backgroundColor:'#FFFFFF',
height:28,
borderRadius:5,
paddingTop:4.5,
paddingBottom:4.5,
paddingLeft:10,
paddingRight:10,
marginTop:7.5,
marginLeft:8,
marginRight:8,
fontSize:15,
flex:1},

poweredContainer:{
justifyContent:'flex-end',
alignItems:'center',
backgroundColor:'#FFFFFF'},

powered:{},
listView:{},


row:{
padding:13,
height:44,
flexDirection:'row'},

separator:{
height:_reactNative.StyleSheet.hairlineWidth,
backgroundColor:'#c8c7cc'},

description:{},
loader:{

flexDirection:'row',
justifyContent:'flex-end',
height:20},

androidLoader:{
marginRight:-15}};var



GooglePlacesAutocomplete=function(_Component){_inherits(GooglePlacesAutocomplete,_Component);




function GooglePlacesAutocomplete(props){_classCallCheck(this,GooglePlacesAutocomplete);var _this=_possibleConstructorReturn(this,(GooglePlacesAutocomplete.__proto__||Object.getPrototypeOf(GooglePlacesAutocomplete)).call(this,
props));_this._isMounted=false;_this._results=[];_this._requests=[];_this.



getInitialState=function(){return{
text:_this.props.getDefaultValue(),
dataSource:_this.buildRowsFromResults([]),
listViewDisplayed:_this.props.listViewDisplayed==='auto'?false:_this.props.listViewDisplayed};};_this.


setAddressText=function(address){return _this.setState({text:address});};_this.

getAddressText=function(){return _this.state.text;};_this.

buildRowsFromResults=function(results){
var res=[];

if(results.length===0||_this.props.predefinedPlacesAlwaysVisible===true){
res=[].concat(_toConsumableArray(_this.props.predefinedPlaces));

if(_this.props.currentLocation===true){
res.unshift({
description:_this.props.currentLocationLabel,
isCurrentLocation:true});

}
}

res=res.map(function(place){return _extends({},
place,{
isPredefinedPlace:true});});


return[].concat(_toConsumableArray(res),_toConsumableArray(results));
};_this.

































_abortRequests=function(){
_this._requests.map(function(i){return i.abort();});
_this._requests=[];
};_this.





triggerFocus=function(){
if(_this.refs.textInput)_this.refs.textInput.focus();
};_this.





triggerBlur=function(){
if(_this.refs.textInput)_this.refs.textInput.blur();
};_this.

getCurrentLocation=function(){
var options={
enableHighAccuracy:false,
timeout:20000,
maximumAge:1000};


if(_this.props.enableHighAccuracyLocation&&_reactNative.Platform.OS==='android'){
options={
enableHighAccuracy:true,
timeout:20000};

}

navigator.geolocation.getCurrentPosition(
function(position){
if(_this.props.nearbyPlacesAPI==='None'){
var currentLocation={
description:_this.props.currentLocationLabel,
geometry:{
location:{
lat:position.coords.latitude,
lng:position.coords.longitude}}};




_this._disableRowLoaders();
_this.props.onPress(currentLocation,currentLocation);
}else{
_this._requestNearby(position.coords.latitude,position.coords.longitude);
}
},
function(error){
_this._disableRowLoaders();
alert(error.message);
},
options);

};_this.

_onPress=function(rowData){
if(rowData.isPredefinedPlace!==true&&_this.props.fetchDetails===true){
if(rowData.isLoading===true){

return;
}

_this._abortRequests();


_this._enableRowLoader(rowData);


var request=new XMLHttpRequest();
_this._requests.push(request);
request.timeout=_this.props.timeout;
request.ontimeout=_this.props.onTimeout;
request.onreadystatechange=function(){
if(request.readyState!==4)return;

if(request.status===200){
var responseJSON=JSON.parse(request.responseText);

if(responseJSON.status==='OK'){
if(_this._isMounted===true){
var details=responseJSON.result;
_this._disableRowLoaders();
_this._onBlur();

_this.setState({
text:_this._renderDescription(rowData)});


delete rowData.isLoading;
_this.props.onPress(rowData,details);
}
}else{
_this._disableRowLoaders();

if(_this.props.autoFillOnNotFound){
_this.setState({
text:_this._renderDescription(rowData)});

delete rowData.isLoading;
}

if(!_this.props.onNotFound){
console.warn('google places autocomplete: '+responseJSON.status);
}else{
_this.props.onNotFound(responseJSON);
}
}
}else{
_this._disableRowLoaders();

if(!_this.props.onFail){
console.warn(
'google places autocomplete: request could not be completed or has been aborted');

}else{
_this.props.onFail();
}
}
};

request.open('GET','https://maps.googleapis.com/maps/api/place/details/json?'+_qs2.default.stringify({
key:_this.props.query.key,
placeid:rowData.place_id,
language:_this.props.query.language}));


if(_this.props.query.origin!==null){
request.setRequestHeader('Referer',_this.props.query.origin);
}

request.send();
}else if(rowData.isCurrentLocation===true){

_this._enableRowLoader(rowData);

_this.setState({
text:_this._renderDescription(rowData)});


_this.triggerBlur();
delete rowData.isLoading;
_this.getCurrentLocation();

}else{
_this.setState({
text:_this._renderDescription(rowData)});


_this._onBlur();
delete rowData.isLoading;
var predefinedPlace=_this._getPredefinedPlace(rowData);


_this.props.onPress(predefinedPlace,predefinedPlace);
}
};_this.

_enableRowLoader=function(rowData){
var rows=_this.buildRowsFromResults(_this._results);
for(var i=0;i<rows.length;i++){
if(rows[i].place_id===rowData.place_id||rows[i].isCurrentLocation===true&&rowData.isCurrentLocation===true){
rows[i].isLoading=true;
_this.setState({
dataSource:rows});

break;
}
}
};_this.

_disableRowLoaders=function(){
if(_this._isMounted===true){
for(var i=0;i<_this._results.length;i++){
if(_this._results[i].isLoading===true){
_this._results[i].isLoading=false;
}
}

_this.setState({
dataSource:_this.buildRowsFromResults(_this._results)});

}
};_this.

_getPredefinedPlace=function(rowData){
if(rowData.isPredefinedPlace!==true){
return rowData;
}

for(var i=0;i<_this.props.predefinedPlaces.length;i++){
if(_this.props.predefinedPlaces[i].description===rowData.description){
return _this.props.predefinedPlaces[i];
}
}

return rowData;
};_this.

_filterResultsByTypes=function(responseJSON,types){
if(types.length===0)return responseJSON.results;

var results=[];
for(var i=0;i<responseJSON.results.length;i++){
var found=false;

for(var j=0;j<types.length;j++){
if(responseJSON.results[i].types.indexOf(types[j])!==-1){
found=true;
break;
}
}

if(found===true){
results.push(responseJSON.results[i]);
}
}
return results;
};_this.

_requestNearby=function(latitude,longitude){
_this._abortRequests();

if(latitude!==undefined&&longitude!==undefined&&latitude!==null&&longitude!==null){
var request=new XMLHttpRequest();
_this._requests.push(request);
request.timeout=_this.props.timeout;
request.ontimeout=_this.props.onTimeout;
request.onreadystatechange=function(){
if(request.readyState!==4){
return;
}

if(request.status===200){
var responseJSON=JSON.parse(request.responseText);

_this._disableRowLoaders();

if(typeof responseJSON.results!=='undefined'){
if(_this._isMounted===true){
var results=[];
if(_this.props.nearbyPlacesAPI==='GoogleReverseGeocoding'){
results=_this._filterResultsByTypes(responseJSON,_this.props.filterReverseGeocodingByTypes);
}else{
results=responseJSON.results;
}

_this.setState({
dataSource:_this.buildRowsFromResults(results)});

}
}
if(typeof responseJSON.error_message!=='undefined'){
console.warn('google places autocomplete: '+responseJSON.error_message);
}
}else{

}
};

var url='';
if(_this.props.nearbyPlacesAPI==='GoogleReverseGeocoding'){

url='https://maps.googleapis.com/maps/api/geocode/json?'+_qs2.default.stringify(_extends({
latlng:latitude+','+longitude,
key:_this.props.query.key},
_this.props.GoogleReverseGeocodingQuery));

}else{
url='https://maps.googleapis.com/maps/api/place/nearbysearch/json?'+_qs2.default.stringify(_extends({
location:latitude+','+longitude,
key:_this.props.query.key},
_this.props.GooglePlacesSearchQuery));

}

request.open('GET',url);
if(_this.props.query.origin!==null){
request.setRequestHeader('Referer',_this.props.query.origin);
}

request.send();
}else{
_this._results=[];
_this.setState({
dataSource:_this.buildRowsFromResults([])});

}
};_this.

_request=function(text){
_this._abortRequests();
if(text.length>=_this.props.minLength){
var request=new XMLHttpRequest();
_this._requests.push(request);
request.timeout=_this.props.timeout;
request.ontimeout=_this.props.onTimeout;
request.onreadystatechange=function(){
if(request.readyState!==4){
return;
}

if(request.status===200){
var responseJSON=JSON.parse(request.responseText);
if(typeof responseJSON.predictions!=='undefined'){
if(_this._isMounted===true){
_this._results=responseJSON.predictions;
_this.setState({
dataSource:_this.buildRowsFromResults(responseJSON.predictions)});

}
}
if(typeof responseJSON.error_message!=='undefined'){
console.warn('google places autocomplete: '+responseJSON.error_message);
}
}else{

}
};
request.open('GET','https://maps.googleapis.com/maps/api/place/autocomplete/json?&input='+encodeURIComponent(text)+'&'+_qs2.default.stringify(_this.props.query));
if(_this.props.query.origin!==null){
request.setRequestHeader('Referer',_this.props.query.origin);
}

request.send();
}else{
_this._results=[];
_this.setState({
dataSource:_this.buildRowsFromResults([])});

}
};_this.

_onChangeText=function(text){
_this._request(text);

_this.setState({
text:text,
listViewDisplayed:true});

};_this.

_handleChangeText=function(text){
_this._onChangeText(text);

var onChangeText=_this.props&&
_this.props.textInputProps&&
_this.props.textInputProps.onChangeText;

if(onChangeText){
onChangeText(text);
}
};_this.










_renderRowData=function(rowData){
if(_this.props.renderRow){
return _this.props.renderRow(rowData);
}

return(
_react2.default.createElement(_reactNative.Text,{style:[{flex:1},defaultStyles.description,_this.props.customStyles.description,rowData.isPredefinedPlace?_this.props.customStyles.predefinedPlacesDescription:{}],
numberOfLines:1,__source:{fileName:_jsxFileName,lineNumber:528}},

_this._renderDescription(rowData)));


};_this.

_renderDescription=function(rowData){
if(_this.props.renderDescription){
return _this.props.renderDescription(rowData);
}

return rowData.description||rowData.formatted_address||rowData.name;
};_this.

_renderLoader=function(rowData){
if(rowData.isLoading===true){
return(
_react2.default.createElement(_reactNative.View,{style:[defaultStyles.loader,_this.props.customStyles.loader],__source:{fileName:_jsxFileName,lineNumber:547}},
_this._getRowLoader()));


}

return null;
};_this.

_renderRow=function(){var rowData=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};var sectionID=arguments[1];var rowID=arguments[2];
return(
_react2.default.createElement(_reactNative.ScrollView,{
style:{flex:1},
scrollEnabled:_this.props.isRowScrollable,
keyboardShouldPersistTaps:_this.props.keyboardShouldPersistTaps,
horizontal:true,
showsHorizontalScrollIndicator:false,
showsVerticalScrollIndicator:false,__source:{fileName:_jsxFileName,lineNumber:558}},
_react2.default.createElement(_reactNative.TouchableHighlight,{
style:{width:WINDOW.width},
onPress:function onPress(){return _this._onPress(rowData);},
underlayColor:_this.props.listUnderlayColor||"#c8c7cc",__source:{fileName:_jsxFileName,lineNumber:565}},

_react2.default.createElement(_reactNative.View,{style:[defaultStyles.row,_this.props.customStyles.row,rowData.isPredefinedPlace?_this.props.customStyles.specialItemRow:{}],__source:{fileName:_jsxFileName,lineNumber:570}},
_this._renderRowData(rowData),
_this._renderLoader(rowData)))));




};_this.

_renderSeparator=function(sectionID,rowID){
if(rowID==_this.state.dataSource.length-1){
return null;
}

return(
_react2.default.createElement(_reactNative.View,{
key:sectionID+'-'+rowID,
style:[defaultStyles.separator,_this.props.customStyles.separator],__source:{fileName:_jsxFileName,lineNumber:585}}));

};_this.

_onBlur=function(){
_this.triggerBlur();

_this.setState({
listViewDisplayed:false});

};_this.

_onFocus=function(){return _this.setState({listViewDisplayed:true});};_this.

_renderPoweredLogo=function(){
if(!_this._shouldShowPoweredLogo()){
return null;
}

return(
_react2.default.createElement(_reactNative.View,{
style:[defaultStyles.row,defaultStyles.poweredContainer,_this.props.customStyles.poweredContainer],__source:{fileName:_jsxFileName,lineNumber:607}},

_react2.default.createElement(_reactNative.Image,{
style:[defaultStyles.powered,_this.props.customStyles.powered],
resizeMode:_reactNative.Image.resizeMode.contain,
source:require('../images/powered_by_google_on_white.png'),__source:{fileName:_jsxFileName,lineNumber:610}})));



};_this.

_shouldShowPoweredLogo=function(){
if(!_this.props.enablePoweredByContainer||_this.state.dataSource.length==0){
return false;
}

for(var i=0;i<_this.state.dataSource.length;i++){
var row=_this.state.dataSource[i];

if(!row.hasOwnProperty('isCurrentLocation')&&!row.hasOwnProperty('isPredefinedPlace')){
return true;
}
}

return false;
};_this.

_renderLeftButton=function(){
if(_this.props.renderLeftButton){
return _this.props.renderLeftButton();
}
};_this.

_renderRightButton=function(){
if(_this.props.renderRightButton){
return _this.props.renderRightButton();
}
};_this.

_getFlatList=function(){
var keyGenerator=function keyGenerator(){return(
Math.random().toString(36).substr(2,10));};


if((_this.state.text!==''||_this.props.predefinedPlaces.length||_this.props.currentLocation===true)&&_this.state.listViewDisplayed===true){
return(
_react2.default.createElement(_reactNative.FlatList,_extends({
style:[defaultStyles.listView,_this.props.customStyles.listView],
data:_this.state.dataSource,
keyExtractor:keyGenerator,
extraData:[_this.state.dataSource,_this.props],
ItemSeparatorComponent:_this._renderSeparator,
renderItem:function renderItem(_ref){var item=_ref.item;return _this._renderRow(item);},
ListFooterComponent:_this._renderPoweredLogo},
_this.props,{__source:{fileName:_jsxFileName,lineNumber:654}})));


}

return null;
};_this.state=_this.getInitialState.call(_this);return _this;}_createClass(GooglePlacesAutocomplete,[{key:'componentWillMount',value:function componentWillMount(){this._request=this.props.debounce?(0,_lodash2.default)(this._request,this.props.debounce):this._request;}},{key:'componentDidMount',value:function componentDidMount(){this._isMounted=true;this._onChangeText(this.state.text);}},{key:'componentWillReceiveProps',value:function componentWillReceiveProps(nextProps){if(nextProps.listViewDisplayed!=='auto'){this.setState({listViewDisplayed:nextProps.listViewDisplayed});}if(typeof nextProps.text!=="undefined"&&this.state.text!==nextProps.text){this.setState({listViewDisplayed:true},this._handleChangeText(nextProps.text));}}},{key:'componentWillUnmount',value:function componentWillUnmount(){this._abortRequests();this._isMounted=false;}},{key:'_getRowLoader',value:function _getRowLoader(){return _react2.default.createElement(_reactNative.ActivityIndicator,{animating:true,size:'small',__source:{fileName:_jsxFileName,lineNumber:515}});}},{key:'render',value:function render()
{var _this2=this;var _props$textInputProps=



this.props.textInputProps,onFocus=_props$textInputProps.onFocus,userProps=_objectWithoutProperties(_props$textInputProps,['onFocus']);
return(
_react2.default.createElement(_reactNative.View,{
style:[defaultStyles.container,this.props.customStyles.container],
pointerEvents:'box-none',__source:{fileName:_jsxFileName,lineNumber:675}},

!this.props.textInputHide&&
_react2.default.createElement(_reactNative.View,{
style:[defaultStyles.textInputContainer,this.props.customStyles.textInputContainer],__source:{fileName:_jsxFileName,lineNumber:680}},

this._renderLeftButton(),
_react2.default.createElement(_reactNative.TextInput,_extends({
ref:'textInput',
returnKeyType:this.props.returnKeyType,
autoFocus:this.props.autoFocus,
style:[defaultStyles.textInput,this.props.customStyles.textInput],
value:this.state.text,
placeholder:this.props.placeholder,

placeholderTextColor:this.props.placeholderTextColor,
onFocus:onFocus?function(){_this2._onFocus();onFocus();}:this._onFocus,
clearButtonMode:'while-editing',
underlineColorAndroid:this.props.underlineColorAndroid},
userProps,{
onChangeText:this._handleChangeText,__source:{fileName:_jsxFileName,lineNumber:684}})),

this._renderRightButton()),


this._getFlatList(),
this.props.children));


}}]);return GooglePlacesAutocomplete;}(_react.Component);exports.default=GooglePlacesAutocomplete;


GooglePlacesAutocomplete.propTypes={
placeholder:_propTypes2.default.string,
placeholderTextColor:_propTypes2.default.string,
underlineColorAndroid:_propTypes2.default.string,
returnKeyType:_propTypes2.default.string,
onPress:_propTypes2.default.func,
onNotFound:_propTypes2.default.func,
onFail:_propTypes2.default.func,
minLength:_propTypes2.default.number,
fetchDetails:_propTypes2.default.bool,
autoFocus:_propTypes2.default.bool,
autoFillOnNotFound:_propTypes2.default.bool,
getDefaultValue:_propTypes2.default.func,
timeout:_propTypes2.default.number,
onTimeout:_propTypes2.default.func,
query:_propTypes2.default.object,
GoogleReverseGeocodingQuery:_propTypes2.default.object,
GooglePlacesSearchQuery:_propTypes2.default.object,
customStyles:_propTypes2.default.object,
textInputProps:_propTypes2.default.object,
enablePoweredByContainer:_propTypes2.default.bool,
predefinedPlaces:_propTypes2.default.array,
currentLocation:_propTypes2.default.bool,
currentLocationLabel:_propTypes2.default.string,
nearbyPlacesAPI:_propTypes2.default.string,
enableHighAccuracyLocation:_propTypes2.default.bool,
filterReverseGeocodingByTypes:_propTypes2.default.array,
predefinedPlacesAlwaysVisible:_propTypes2.default.bool,
enableEmptySections:_propTypes2.default.bool,
renderDescription:_propTypes2.default.func,
renderRow:_propTypes2.default.func,
renderLeftButton:_propTypes2.default.func,
renderRightButton:_propTypes2.default.func,
listUnderlayColor:_propTypes2.default.string,
debounce:_propTypes2.default.number,
isRowScrollable:_propTypes2.default.bool,
text:_propTypes2.default.string,
textInputHide:_propTypes2.default.bool};

GooglePlacesAutocomplete.defaultProps={
placeholder:'Search',
placeholderTextColor:'#A8A8A8',
isRowScrollable:true,
underlineColorAndroid:'transparent',
returnKeyType:'default',
onPress:function onPress(){},
onNotFound:function onNotFound(){},
onFail:function onFail(){},
minLength:0,
fetchDetails:false,
autoFocus:false,
autoFillOnNotFound:false,
keyboardShouldPersistTaps:'always',
getDefaultValue:function getDefaultValue(){return'';},
timeout:20000,
onTimeout:function onTimeout(){return console.warn('google places autocomplete: request timeout');},
query:{
key:'missing api key',
language:'en',
types:'geocode'},

GoogleReverseGeocodingQuery:{},
GooglePlacesSearchQuery:{
rankby:'distance',
types:'food'},

customStyles:{},
textInputProps:{},
enablePoweredByContainer:true,
predefinedPlaces:[],
currentLocation:false,
currentLocationLabel:'Current location',
nearbyPlacesAPI:'GooglePlacesSearch',
enableHighAccuracyLocation:true,
filterReverseGeocodingByTypes:[],
predefinedPlacesAlwaysVisible:false,
enableEmptySections:true,
listViewDisplayed:'auto',
debounce:0,
textInputHide:false};



var create=function create(){var options=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};
return _react2.default.createClass({
render:function render(){
return(
_react2.default.createElement(GooglePlacesAutocomplete,_extends({
ref:'GooglePlacesAutocomplete'},
options,{__source:{fileName:_jsxFileName,lineNumber:796}})));


}});

};

module.exports={
GooglePlacesAutocomplete:GooglePlacesAutocomplete,
create:create};