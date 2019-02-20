// Модуль сообщений
var message = (function($) {

    var messageData = [],
        opts = {};

    // Инициализация модуля
    function init(options) {
		
        // Инициализируем настройки
		_initOptions(options);
		
		// Навешивам события
       _bindHandlers();
    }

	// Инициализируем настройки
	function _initOptions(options) {
		var defaultOptions = {	
			elButtonProfile: 			'.nav-profile-item',
			elProfileItem: 				'.nav-item',
			elProfileImageClick: 		'.no-gutter a',
			elMessageClick: 			'.select-message',
			elMessageSelected: 			'in-message_selected',
			elNavbarMessageDefault: 	'.navbar-message-default',
			elNavbarMessageSelected: 	'.navbar-message-selected',
			elNavbarMessageName: 		'.navbar-message-name',
			elNavbarMessageCount: 		'.navbar-message-count',
			elButtonDeselectAll: 		'.in_deselect_all',
			elBoxMessage: 				'.box-message',
			elBoxMessageSelected: 		'mode-selected',
			attrLoad:					'data-load',
			attrMessageId:				'data-msgid',
		}
		_.defaults(options || {}, defaultOptions);
		opts = _.clone(options);
	}
	
	// Навешивам события
	function _bindHandlers() {
		_selectedMessageBind();
		_deSelectedMessageBind();
		$(document).on('click', '[data-toggle="lightbox"]', function(event) {
                event.preventDefault();
                $(this).ekkoLightbox();
            });
	}
	
	// Set event handler to highlight messages
	function _selectedMessageBind() {
		
		$(opts.body).on('click', opts.elMessageClick, function() {
			var $this = $(this);
			$(opts.elBoxMessage).addClass(opts.elBoxMessageSelected);
			if($this.parent().hasClass(opts.elMessageSelected)) {
				return _selectedMessageInit($this, false);
			}
			_selectedMessageInit($this);
		});	
	}
	
	// Clear all selected messages
	function _deSelectedMessageBind() {
		
		$(opts.body).on('click', opts.elButtonDeselectAll, function() {
			_.each(messageData, function(num){
				$(opts.elBoxMessage).find('['+opts.attrMessageId+'='+num.id+']').removeClass(opts.elMessageSelected);
			});
			_removeMessageNavbarSupp();
			messageData = [];
		});	
	}
	
	// Message selection function
	function _selectedMessageInit(in_message, selected = true) {
		
		// Remove message from object
		if(!selected) 
			in_message.parent().removeClass(opts.elMessageSelected);
		
		// Add message to object
		else 
			in_message.parent().addClass(opts.elMessageSelected);
		
		var message = in_message.parent().attr(opts.attrMessageId);
		
		_renderNavbarMessageInit(selected, message);
	}
	
	// The render function of the navbar message
	function _renderNavbarMessageInit(methodClick, item) {
		
		if(!_getByIdInit(item)) {
			messageData.push({'id': item});
        } 
		else {
			_removeByIdInit(item);
			methodClick = messageData.length > 0 ? !0 : !1; 
		}
		
		switch(methodClick) {
			case true: _addMessageNavbarSupp(messageData);
			break;
			case false: _removeMessageNavbarSupp();
			break;
		}
	}
	
	// Show message navigation bar
	function _addMessageNavbarSupp(data) {
		var length = _declOfNumInit(data.length, ['сообщение', 'сообщения', 'сообщений']);
		$(opts.elNavbarMessageDefault).hide();
		$(opts.elNavbarMessageSelected).show();
		$(opts.elNavbarMessageName).hide();
		$(opts.elNavbarMessageCount).show().find('span').text(data.length+' '+length);
	}
	
	// Hide message navigation bar	
	function _removeMessageNavbarSupp() {
		$(opts.elNavbarMessageDefault).show();
		$(opts.elNavbarMessageSelected).hide();
		$(opts.elNavbarMessageCount).hide(); 
		$(opts.elNavbarMessageName).show();
        $(opts.elBoxMessage).removeClass(opts.elBoxMessageSelected);
	}
	
	// Declination of words by number
	function _declOfNumInit(number, titles) {  
		cases = [2, 0, 1, 1, 1, 2];  
		return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
	}
	
	// Remove message from collection
	function _removeByIdInit(id) {
		messageData = _.reject(messageData, function(item) {
            return item.id === id;
        });
		return messageData;
	}
	
	// Find message in collection
    function _getByIdInit(id) {
        return _.findWhere(messageData, {id: id});
    }

    // Экспортируем наружу
    return {
        init: init
    }

})(jQuery);

// Модуль приложения
var main = (function($) {
	
    var options = {
		body		: 'body',
		profileBox	: '#profile'
	},
	optionsExtra = _.extend({
		renderMenu: true
	}, options);

	// Запускаем модули в зависимости от их потребности на запрошенной странице
    function init() {
        message.init(optionsExtra);
    }
    
    return {
        init: init
    }    

})(jQuery);

jQuery(document).ready(main.init);