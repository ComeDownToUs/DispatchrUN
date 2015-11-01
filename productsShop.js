Products = new Mongo.Collection('products');
//UserDetails = new Mongo.Collection('userDeets');//possible inclusion to avoid clutter in profile
UserAddress = new Mongo.Collection('addresses');
Cart = new Mongo.Collection('cart');
Orderings = new Mongo.Collection('orderings');
AppMsg = new Mongo.Collection('messages');

if (Meteor.isClient) {

	angular.module('productsShop',['angular-meteor', 'ui.router']);
	
	var theMod = angular.module('productsShop');//previous error caused by redefining https://docs.angularjs.org/error/$injector/unpr?p0=e

	theMod.config(['$urlRouterProvider', '$stateProvider', '$locationProvider' ,function($urlRouterProvider, $stateProvider, $locationProvider){

		$locationProvider.html5Mode(true);

		$stateProvider
			.state('products', {
			  url: '/',
			  templateUrl: 'productList.ng.html',
			  controller: 'ProductList'
			})
			.state('register', {
			  url: '/register',
			  templateUrl: 'register.ng.html',
			  controller: 'Register'
			})
			.state('addProduct', {
			  url: '/addProduct',
			  templateUrl: 'addProduct.ng.html',
			  controller: 'AddProduct'
			})
			.state('product', {
			  url: '/product/:productId',
			  templateUrl: 'productView.ng.html',
			  controller: 'ProductView'
			})
			.state('account', {
				url: '/account',
				templateUrl: 'accountView.ng.html',
				controller: 'AccountView'
			})
			.state('checkout', {
				url: '/checkout',
				templateUrl: 'checkout.ng.html',
				controller: 'Checkout'
			})
			.state('orders', {
				url: '/orders',
				templateUrl: 'orders.ng.html',
				controller: 'ViewOrders'
			})
			.state('order', {
				url: '/order/:orderId',
				templateUrl: 'orderView.ng.html',
				controller: 'ViewAnOrder'
			})
			.state('orderSearch', {
				url: '/order',
				templateUrl: 'order.ng.html',
				controller: 'SearchOrders'
			});

		$urlRouterProvider.otherwise("/");
    }]);

	theMod.controller('ProductList', ['$scope', '$meteor',function ($scope, $meteor) {

			$scope.products = $meteor.collection( function() {
				return Products.find( $scope.getReactively('query'), {sort: {createdAt: -1},  })
			});//getReactively on query ensures instant refrest
			
			$scope.addCart = function(p){
				$meteor.call('addToCart', p);	
				console.log("b");
			};
			
			$scope.isAdmin = function(){
				$meteor.call('isAdmin');
			};
				
			$scope.$watch('hideUnavailable', function() {
				if ($scope.hideUnavailable)
					$scope.query = {status: ['Available']};
				else
					$scope.query = {};
			});	
			
			$scope.inStock = function(x){
				if(x.status[x.status.length-1].toLowerCase() ==="available"){
					return true;
				}
				else{
					return false;
				}
			};
	}]);
	theMod.controller('Register', ['$scope', '$meteor',function ($scope, $meteor) {
		//only admin and unregistered users can view this page
		$scope.isAdmin = function(){
			$meteor.call('isAdmin');
		};
		$scope.isCustomer = function(){
			$meteor.call('isCustomer');
		};
		$scope.isNotLogged = function(){
			$meteor.call('isNotLoggedIn');
		};
		if($scope.isCustomer){
				console.log("customers can't view here");
		}
		
		$scope.setUpAccount = function(user){
			$meteor.call('setUpAccount', user);
		};
		$scope.registerUser = function(user){
			var theDeets = {//details for profile part of user data
				firstname: user.fname,
				lastname: user.lname,
				phone1:	user.phone1,
				phone2: user.phone2,
				type: "customer",
				createdAt: new Date() 
				};
			if (user.role === "admin"){			//conditional to change status type
				theDeets.type = user.role;
			}
			var userID = Accounts.createUser({//creates user, profile contains extra info, this may need to be relocated for privacy sake
				email: user.email,
				password: user.pass1,
				profile: theDeets
			});
			$scope.setUpAccount(user);
		};
	}]);
	theMod.controller('AddProduct', ['$scope', '$meteor',function ($scope, $meteor) {
		$scope.isAdmin = function(){
			$meteor.call('isAdmin');
		};
		
		if(!$scope.isAdmin()){
			console.log("only admin should be in here");
		}
		
		$scope.addProduct = function(user){
			$meteor.call('addProduct', user);
		};
	}]);
	theMod.controller('ProductView', ['$scope', '$meteor', '$stateParams',function ($scope, $meteor, $stateParams) {
		console.log($stateParams);
		$scope.product = Products.findOne($stateParams.productId);
		
		$scope.isAdmin = function(){
			$meteor.call('isAdmin');
		};
		
		$scope.updateProd = function(user){
			$meteor.call('editProd', user);
		};
		$scope.toggle = false;
		$scope.switchIt = function(){
			$scope.toggle = !$scope.toggle;
		};
		
		$scope.addCart = function(p){
			$meteor.call('addToCart', p);	
			console.log("b");
		};
		
	}]);
	theMod.controller('AccountView', ['$scope', '$meteor', function($scope, $meteor){
			if(Meteor.user()!==undefined)
				$scope.yourProf = Meteor.user().profile;
			
			$scope.theView = true;
			$scope.aView = true;
			
			$scope.switchIt = function(){
				$scope.theView = !$scope.theView;
			}
			$scope.hideShow = function(){
				$scope.aView= !$scope.aView;
			}
			
			$scope.addresses = $meteor.collection( function() {
				return UserAddress.find( {userId: Meteor.userId()}, {sort: {createdAt: -1} });
			});
			
			$scope.updateProf = function(newData){
				$meteor.call('updateProf', newData);
				$scope.switchIt();
				//need to refresh page here
			};
			
			$scope.makePrimary = function(add){
				$meteor.call('makePrimary', add);
			};
			$scope.addAddress = function(user){
				$meteor.call('addAddress', user);
				$scope.hideShow();
			};
			$scope.deleteAddress = function(add){
				$meteor.call('removeAddress', add);
			};
	}]);
	theMod.controller('Checkout', ['$scope', '$meteor', function($scope, $meteor){
		$scope.isACustomer = function(){
			$meteor.call('isCustomer');
		};
		
		if(!$scope.isACustomer()){
				console.log("only customers can buy so redirect here");
		}
		$scope.basket = Cart.findOne( {cartId: Meteor.userId()} );
		//
		$scope.emptyBasket = function(){
			$scope.basket = Cart.findOne( {cartId: Meteor.userId()} );
			if($scope.basket.products.length>0){
				return true;
			}
			else{
				return false;
			}
		}
		$scope.inBasket = function(productID){
			return Products.findOne(productID);
		};
		$scope.getTotal = function(){
			var total = 0;
			var basket = Cart.findOne({cartId: Meteor.userId()});
			console.log(basket);
			for(var i=0; i<basket.products.length;i++){
				total = total + ( Products.findOne(basket.products[i].product).price * basket.products[i].quantity);
			}
			console.log(total);
			return total;
		};
		$scope.privTot = function(){
			$meteor.call('getTotal');
		};
		$scope.buyThem = function(){
			$meteor.call('buyIt',$scope.privTot());	
		};
		$scope.updateQuantity = function(thing, theQ){
			for(var i=0; i<$scope.basket.products.length; i++){
				if($scope.basket.products[i]._id===thing){
					$scope.basket.products[i].quantity = theQ;
				}
			}
			$meteor.call('updateQuantity', $scope.basket);
		};
		$scope.getRidOf = function(item){
			for(var i=0; i<$scope.basket.products.length; i++)
				if($scope.basket.products[i]._id===item._id)
					$scope.basket.products.splice(i, 1);
			$meteor.call('removeFromBasket', $scope.basket);
		};
		
	}]);
	theMod.controller('ViewOrders', ['$scope', '$meteor',function($scope, $meteor){
			$scope.isACustomer = function(){
				$meteor.call('isCustomer');
			};
			
			$scope.isAdmin = function(){
				$meteor.call('isAdmin');
			};
			
			if(!$scope.isACustomer()){
					console.log("only customers can buy so redirect here");
			}
			
			$scope.orders = $meteor.collection( function() {
				var yah = Meteor.userId();
				return Orderings.find( {userInfo: Meteor.userId() }, {sort: {createdAt: -1} });
			});
	}]);
	theMod.controller('ViewAnOrder', ['$scope', '$meteor', '$stateParams', function($scope, $meteor, $stateParams){
			var lookAt=false;
			
			console.log($stateParams);
			
			$scope.orderExists = function(order){
				if(order!==undefined){
					return true;
				}
				else{
					return false;
				}
			}
			
			$scope.order = Orderings.findOne( $stateParams.orderId );
			if(typeof Meteor.user() === undefined || Meteor.user() === null	||
				typeof Meteor.user().profile === undefined ||  Meteor.user().profile === null ||
				Meteor.user().profile.type === "customer" || Meteor.user().profile.type === "admin"){
				console.log("incomplete here");
				
				if(Meteor.user().profile.type === "admin"){
					lookAt = true;
					console.log("admin can search all orderId's\nwhile users should be restricted to only their own");
				}
			}
			else{
				console.log("Should reditrect");
			}	
			
	}]);
	theMod.controller('SearchOrders', ['$scope', '$meteor', '$location', function($scope, $meteor, $location){
		$scope.searchOrder = function(x){
			$location.url('order/'+x);
		};
	}]);
	
	/*
	theMod.controller('Dashboard', ['$scope', '$meteor',
		function($scope, meteor){
			
		}
	]);
	theMod.controller('EditEmail', ['$scope', '$meteor', 
		function($scope, $meteor){

		}
	]);*/
	
	Template.login.events({
		'submit form': function(event) {
			event.preventDefault();
			var emailAdd = event.target.lEmail.value;
			var passw = event.target.lPassword.value;
			console.log("Form submitted.");
			Meteor.loginWithPassword(emailAdd, passw, 
				function(error){
					if(error)
						console.log(error.reason);
					else
						Router.go("/products");
				}
			);
		}
	});
	Template.loggedin.events({
		'click .logout': function(event){
			event.preventDefault();
			Meteor.logout();
		}
	});
	Template.loggedin.helpers({
		fullname: function(){
			return Meteor.user().profile.firstname + " "+Meteor.user().profile.lastname;
		}
	});
}

Meteor.methods({
	addToCart: function(p) {//productview
				var uID = Meteor.userId();
				var bask = Cart.findOne({cartId: uID});
				var already = false;
				console.log(bask);
				///search for prior entries
				console.log({product: p._id, quantity: 1});
				var newThing = {};
				newThing.product= p._id; 
				newThing.quantity= parseInt(1);
				delete newThing['$$hashKey'];
				for(var i=0; i<bask.products.length; i++){
					if(bask.products[i].product===p._id){
						bask.products[i].quantity =  parseInt(bask.products[i].quantity) + 1;
						already = true;
					}
				}
				if(already === false){
					bask.products.push(newThing);
				}
				Cart.update(bask._id, bask);
			},
	setUpAccount: function(user){//register
			UserAddress.insert({//user's first address is their initial primary (i.e. default) address
				userId: Meteor.userId(),
				address: user.address,
				state: user.state,
				zipcode: user.zipcode,
				country: user.country,
				status: "primary"
			});
			//users shopping cart created immediately, empty on default
			Cart.insert({
				cartId: Meteor.userId(),
				products: []
			});
			AppMsg.insert({//possible messaging system for the future
				userId: Meteor.userId(),
				messages: []
			});	
		},
	addProduct: function(user){
			Products.insert({
				name: user.name,
				price: parseFloat(user.price),
				description: user.desc,
				image: user.image,
				status: [user.status],//for adding information about status
				createdAt: new Date(),
				addedBy: Meteor.userId()//for checking recent changes
			});
			//go to product's page
		},
	updateProf: function(newData){
			var newInfo = {
					firstname: newData.fname,
					lastname: newData.lname,
					phone1:	newData.phone1,
					phone2: newData.phone2,
					type: Meteor.user().profile.type,
					createdAt: Meteor.user().profile.createdAt				
			};
			Meteor.users.update(Meteor.userId(), {$set: {profile: newInfo}});//set only will change the respective values
			//need to refresh page here
		},
	makePrimary: function(add){
			var used = UserAddress.findOne({status: "primary"});
			UserAddress.update( used._id, {$set: {status: "other"}});
			UserAddress.update( add._id, {$set: {status: "primary"}});
		},
	addAddress: function(user){
			UserAddress.insert({
				userId: Meteor.userId(),
				name: user.name,
				address: user.address,
				state: user.state,
				zipcode: user.zipcode,
				country: user.country,
				status: user.stat
			});
		},
	removeAddress: function(add){
			if(Meteor.userId()===add.userId)
				UserAddress.remove(add._id);
		},
	getTotal: function(){
			var total = 0;
			var basket = Cart.findOne({cartId: Meteor.userId()});
			console.log(basket);
			for(var i=0; i<basket.products.length;i++){
				total = total + ( Products.findOne(basket.products[i].product).price * basket.products[i].quantity);
			}
			console.log(total);
			return total;
		},
	isAdmin: function(){
		if(typeof Meteor.user() !== undefined && typeof Meteor.user().profile === undefined &&  
			typeof Meteor.user().profile.type !== undefined &&
			Meteor.user().profile.type === "admin"){
				return true;
		}
		return false;
	},
	isCustomer: function(){
		if(typeof Meteor.user() !== undefined && typeof Meteor.user().profile === undefined &&  
			typeof Meteor.user().profile.type !== undefined &&
			Meteor.user().profile.type === "customer"){
				return true;
		}
		return false;
	},
	isNotLoggedIn: function(){
		if(typeof Meteor.user() === undefined || Meteor.user() === null){
				return true;
		}
		return false;
	},
	editProd: function(prod){
		Products.update(prod._id, {$set: {
				name: prod.name,
				price: parseFloat(prod.price),
				description: prod.desc,
				status: prod.status,//for adding information about status
				editedBy: Meteor.userId()
				}
			});
	},
	updateQuantity: function(basket){
		for(var jj=0; jj<basket.products.length;jj++){
				delete basket.products[jj]['$$hashKey'];
		}
		console.log(basket);
		Cart.update(basket._id, basket);
	},
	removeFromBasket: function(basket){
		for(var jj=0; jj<basket.products.length;jj++){
				delete basket.products[jj]['$$hashKey'];
		}
		console.log(basket);
		Cart.update(basket._id, basket);
	},
	buyIt: function(argu){
		var aBasket = Cart.findOne({cartId: Meteor.userId()});
			for(var jj=0; jj<aBasket.products.length;jj++){
				delete aBasket.products[jj]['$$hashKey'];
				console.log(jj);
			}
			var usId = Meteor.userId();
			console.log({
				userInfo: usId,
				products: aBasket.products,
				price: argu
				//address: 
			});
			Orderings.insert({
				userInfo: usId,
				products: aBasket.products,
				price: parseFloat(argu),
				date: new Date(),
				//address: //the delivery address
				status: "ordered"//to be updated by user once delivered
			});
			
			Cart.update(aBasket._id, {$set: {products: [ ]}});//emptying users cart
			//return Cart.findOne(aBasket._id);
	}
});

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});
}
