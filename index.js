var aws = require("aws-lib");

var xml2js=require("xml2js");

var accessKeyId='<Your accessKey>';

var secretAccessKey='<your Secret key>';

var associateTag='technocrat';

var prodAdv = aws.createProdAdvClient(accessKeyId, secretAccessKey, associateTag);

var options = {SearchIndex: "Electronics", Keywords: "Samsung Galaxy Tab 3"}

var asinIds=[];

prodAdv.call("ItemSearch", options, function(err, result) {
    /*xml2js.parseString(result,function(err,jsonResult){
        .log(jsonResult);
    });*/
    var items=result.Items.Item;

    //console.log(items);

    var len=items.length;
    
    for(var i=0;i<len;i++){
    	asinIds.push(items[i].ASIN);
    	console.log(asinIds[i]);
    }
    var len=asinIds.length;
	options={};
	options.ResponseGroup="Offers";
	options.IdType="ASIN";
	var asinToAbsolutePrice=[];
	var asinToFormattedPrice=[];

	for(var i=0;i<len;i++){
	   options.ItemId=asinIds[i];
	   var asin=asinIds[i];
	   //console.log(JSON.stringify(options));
	   prodAdv.call("ItemLookup", options, function(err,result){
	   	  var lowest=result.Items.Item.OfferSummary.LowestNewPrice;
	   	  if(lowest==undefined)
	   	  	  return;
	   	  asinToFormattedPrice[asin]=lowest.FormattedPrice;
	   	  asinToAbsolutePrice[asin]=Number(lowest.Amount);
	   	  console.log("ASIN:"+asin);
	   	  console.log("Absolute Price:"+lowest.Amount);
	   	  console.log("FormattedPrice:"+lowest.FormattedPrice);

	   });
	}
});


