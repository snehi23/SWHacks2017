

exports.handler = (event, context, callback) => {

	var aws = require("aws-lib");

	var eventStr = JSON.stringify(event);

	//console.log(eventStr);

	var asinIds=[];

	var prodAndCategoryObj = {
		"prodValue" : null, 
		"catValue" : null,
		"printValues": function() {
			console.log("Product Value is "+ this.prodValue);
			console.log("Categories Value is "+ this.catValue);
		}
	};

	var getProductAndCategoryValue = function(event) {

		if(event.request !== undefined) {
			var request = event.request;
				if(request.intent !== undefined) {
					var intent = request.intent;
						if(intent.slots !== undefined) {
							var slots = intent.slots;
						}
						else {
							return;
						}	
				} else {

					return;
				}
		} else {

			return;
		}

		if(slots === undefined) {
			return;
		} else {

			var Categories = slots.Categories;

			prodAndCategoryObj.catValue = Categories.value;

			var Product = slots.Product;

			prodAndCategoryObj.prodValue = Product.value;

		}

	};


	var responseObj = {
				        "version": "1.0",
				        "response": {
				            "outputSpeech": {
				            "type": "PlainText",
				            "text": ""
				        }
					  }
				  	};

	getProductAndCategoryValue(event);

	console.log(" Product and Categories object is : "+JSON.stringify(prodAndCategoryObj));

   	var authObj = {
   		"accessKeyId" : "",
   		"secretAccessKey" : "",
   		"associateTag" : ""
   	};

	var prodAdvAPI = aws.createProdAdvClient(authObj.accessKeyId, authObj.secretAccessKey, authObj.associateTag);

	if(prodAndCategoryObj.catValue ===  undefined || prodAndCategoryObj.catValue === null) {
		prodAndCategoryObj.catValue = "All";
	}

    console.log('Category Values are : '+ prodAndCategoryObj.printValues());

    prodAndCategoryObj.catValue = prodAndCategoryObj.catValue.charAt(0).toUpperCase() + prodAndCategoryObj.catValue.slice(1);

    console.log('Updated Values are : '+ prodAndCategoryObj.printValues());

    function sendMin(min, isError) {

    	var responseText;

    	if(prodAndCategoryObj.prodValue === undefined || prodAndCategoryObj.catValue === null) {

    		responseText = "Sorry we could not find product on marketplace. Please try again.";

    	} else {

    		responseText = "Sorry we could not find product "+ prodAndCategoryObj.prodValue + " on marketplace. Please try again.";
    	}

    	if(isError === false) {
    	 	responseText = "The best price for "+ prodAndCategoryObj.prodValue +" is "+min;
    	}

		responseObj.response.outputSpeech.text = responseText;	

		console.log("Response Text is : " + JSON.stringify(responseObj));  

		callback(null, responseObj);				 	

	}

	var options = {};

	options.Keywords = prodAndCategoryObj.prodValue;
    options.SearchIndex = prodAndCategoryObj.catValue;

    prodAdvAPI.call("ItemSearch", options, function(err, result) {

    		//console.log("Item Search Result: "+ JSON.stringify(result.Items));

    		var items=[];

    		if(result.Items.Item !== undefined && result.Items.Item.length > 0)	{ 

		    	items = result.Items.Item;

		    } else {

		    	sendMin(0, true);
		    	return;	

		    }	

		    items.forEach(function(item, index, Array) {
		    	asinIds.push(item.ASIN);	
		    });
		    
		    var options = {};

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
			   
			   prodAdvAPI.call("ItemLookup", options, function(err,result){

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
				     
				   	  asinToAbsolutePrice[asin]=Number(lowest.Amount);
				   	  //console.log("ASIN:"+asin);
				   	  //console.log("Absolute Price:"+lowest.Amount);
				   	  //console.log("FormattedPrice:"+lowest.FormattedPrice);

				   	  if(minObj.counter==0){

							sendMin(minObj.FormattedPrice, false);				   	  	
				   	  }

			   	  });

			 } 
			 	  	  
	});



};






