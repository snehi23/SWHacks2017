exports.handler = (event, context, callback) => {

	var str = JSON.stringify(event);

    var request = event.request;
    var intent = request.intent;
    var slots = intent.slots;
    
    var Categories = slots.Categories;
    var Cvalue = Categories.value;
    
    var Product = slots.Product;
    var Pvalue = Product.value;

    var aws = require("aws-lib");

	var accessKeyId='';

	var secretAccessKey='';

	var associateTag='';

	var prodAdv = aws.createProdAdvClient(accessKeyId, secretAccessKey, associateTag);

	var options = {SearchIndex: "Electronics", Keywords: "Samsung Galaxy Tab 3"}

	var asinIds=[];

	if(Cvalue==undefined)
		Cvalue="All";

    console.log('Product Name : '+Pvalue + ' in Category '+ Cvalue);

    var updatedCValue = Cvalue.charAt(0).toUpperCase() + Cvalue.slice(1);

    console.log('Updated Category Name : '+updatedCValue);

    options.Keywords = Pvalue;
    options.SearchIndex = updatedCValue;

    function sendMin(min, isError) {

    	var responseText = "Sorry we could not find product "+ Pvalue + " on marketplace. Please try again.";

    	if(isError == false)
    	 responseText = "The best price for "+ Pvalue +" is "+min;

					var response = {
				        "version": "1.0",
				        "response": {
				            "outputSpeech": {
				            "type": "PlainText",
				            "text": responseText
				        }
					  }
				  	}

		console.log(JSON.stringify(response));  

		callback(null, response);				 	

	}

    prodAdv.call("ItemSearch", options, function(err, result) {


    		console.log(JSON.stringify(result.Items));

		    var items=result.Items.Item;

		    if(items == undefined) {
		    	sendMin(0,true);
		    	return;
		    }


		    var len=items.length;
		    
		    for(var i=0;i<3;i++){
		    	asinIds.push(items[i].ASIN);
		    	console.log(asinIds[i]);
		    }
		    var len=asinIds.length;
			options={};
			options.ResponseGroup="Offers";
			options.IdType="ASIN";
			var asinToAbsolutePrice=[];
			var asinToFormattedPrice=[];

			 var minObj={};

			 minObj.min=Infinity;
			 minObj.counter=asinIds.length; 

			for(var i=0;i<asinIds.length;i++){
			   options.ItemId=asinIds[i];
			   var asin=asinIds[i];
			   
			   prodAdv.call("ItemLookup", options, function(err,result){

			   	  var lowest=result.Items.Item.OfferSummary.LowestNewPrice;
			   	  if(lowest==undefined){
			   	  	  console.log("undefined lowest");
			   	  	  return;
			   	  }
			   	  asinToFormattedPrice[asin]=lowest.FormattedPrice;
			   	  var absolutePrice = Number(lowest.Amount);

			   	  minObj.counter-=1;

				  if(minObj.min > absolutePrice){
				   	  	minObj.min = absolutePrice;
				   	  	minObj.FormattedPrice=lowest.FormattedPrice;
				  }
				   
				      //console.log("Minimum:"+minObj.min);	  
				   	  asinToAbsolutePrice[asin]=Number(lowest.Amount);
				   	  console.log("ASIN:"+asin);
				   	  console.log("Absolute Price:"+lowest.Amount);
				   	  console.log("FormattedPrice:"+lowest.FormattedPrice);

				   	  if(minObj.counter==0){

							sendMin(minObj.FormattedPrice, false);				   	  	
				   	  }

			   	  });

			 } 
			 	  	  
	});



};



