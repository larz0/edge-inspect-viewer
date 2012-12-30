/**
 * @fileOverview Adobe Edge Inspect - Snapshot Viewer
 * @name snapshots
 * @author Peter Schmalfeldt <me@peterschmalfeldt.com>
 * @link https://github.com/manifestinteractive/edge-inspect-viewer
 */

/** @constructor */
var snapshots = (typeof window.snapshots !== 'undefined') ? window.snapshots : (function(){

	/** Private Variables */
	var vars = {
		/**
		 * Debug Level
		 * 5 = log, debug, info, warn, & error
		 * 4 = debug, info, warn, & error
		 * 3 = info, warn, & error
		 * 2 = warn & error
		 * 1 = error
		 * 0 = disable all debug messages
		 */
		debug_level: 5,

		/** Selected Group for pre-deletion */
		selected_group: null,

		/** Object to store Device list for those that might want access to it */
		devices: null,

		/** Keep track of which Snapshot Group we're looking at */
		current_page: 1,

		/** This will get updated to how many Snapshot Groups come back */
		total_pages: 0,

		/** Store AJAX calls so we can abort them if needed */
		ajax_call: null,

		/** Store AJAX calls so we can abort them if needed */
		animation_speed: 250
	};

	/** Setup Lo Dash Templates */
	var templates = {

		/** Template for Rendering Snapshot Groups */
		snapshot: _.template('<a name="page<%= count+1 %>" id="page<%= count+1 %>"></a><section class="devices <%= url_class %> <%= date_class %>"><h1><a href="#confirm_delete" role="button" class="btn remove" data-toggle="modal" rel="tooltip" data-placement="top" data-original-title="Delete Snapshot Group" onclick="return snapshots.prep_deletion(<%= count %>);"><i class="icon-remove"></i></a><%= date_time %></h1><h3>URL:&nbsp; <a href="<%= url %>" target="_blank"><%= url %></a></h3><div style="width: 100%; clear: both; display: block;"></div><%= devices %><div class="clearfix"></div></section>'),

		/** Template for Rendering each Device */
		device: _.template('<a href="<%= image %>" rel="<%= group_class %>" title="<%= current %> of <%= total %>: ( <%= device %> <%= device_model %> - <%= os_name %> <%= os_version %> [ <%= device_res %> <%= pixel_density %> ]" class="fancybox device <%= filter_class_names %>" style="background-image: url(\'<%= image %>\')"><span class="label label-<%= label %>"><%= os_name %> <%= os_version %></span><div class="details"><p><%= device %></p></div></a>'),

		/** Template for Rendering Date Filter List Options */
		date_filter: _.template('<li><a href="#" class="selection <%= date_class %>" onclick="return snapshots.filter_date(\'.<%= date_class %>\');"><i class="icon-filter"></i> <%= date %></a></li>'),

		/** Template for Rendering URL Filter List Options */
		url_filter: _.template('<li><a href="#" class="selection <%= url_class %>" onclick="return snapshots.filter_url(\'.<%= url_class %>\');"><i class="icon-filter"></i> <%= url %></a></li>'),

		/** Template for Rendering Operating System Filter List Options */
		operating_systems_filter: _.template('<li><a href="#" class="<%= os_class %> selection" onclick="return snapshots.filter_os(\'.<%= os_class %>\');"><i class="icon-filter"></i> <%= name %></a></li>')
	};

	return {

		/** Initialize Snapshots ( This will also check that everything is setup correctly ) */
		init: function(){

			debug.setLevel(vars.debug_level);

			debug.info('snapshots.init();');

			/** Abort any previous AJAX calls */
			if(vars.ajax_call)
			{
				vars.ajax_call.abort();
			}

			/** AJAX call to fetch Snapshots */
			vars.ajax_call = jQuery.ajax({
				url: 'snapshots.php',
				data: {
					'task': 'get_snapshots'
				},
				dataType: 'json',
				cache: false,
				success: function(data) {

					debug.log(data);

					if(data.errors.length > 0)
					{
						debug.error(data.errors);
						/** Render Date Filters using templates */
						jQuery.each(data.errors, function(i, item){
							jQuery('#error_message .modal-body').append('<p>'+item.message+'</p>');
						});
						jQuery('#error_message').modal('show');
						vars.ajax_call = null;

						return false;
					}

					/** Store returned JSON data for people to play with */
					vars.devices = data;
					vars.total_pages = data.snapshots.length;

					/** Check if we got anything, and prompt if not */
					if(data.snapshots.length === 0)
					{
						jQuery('#no_files').modal('show');
						return false;
					}

					/** Set some variables to use during the loop */
					var unique_date = '';
					var device_markup = '';
					var dates_filter_markup = '';
					var url_filter_markup = '';
					var operating_systems_filter_markup = '';

					/** Render Snapshots using templates */
					jQuery.each(data.snapshots, function(i, item){

						/** Generate Device Specific Markup from Template */
						jQuery.each(item.devices, function(j, device){
							device_markup += templates.device({
								'date': device.date,
								'device': device.device,
								'device_model': device.device_model,
								'device_res': device.device_res,
								'display_date': device.display_date,
								'image': device.image,
								'os_name': device.os_name,
								'os_version': device.os_version,
								'page_size': device.page_size,
								'pixel_density': device.pixel_density,
								'select_date': device.select_date,
								'url': device.url,
								'group_class': item.group_class,
								'current': (j+1),
								'total': item.devices.length,
								'label': (device.os_name == 'iOS') ? 'info' : 'success',
								'filter_class_names': device.os_name.replace(' ', '_').toLowerCase() + ' ' + device.os_name.replace(' ', '_').toLowerCase() + '_version_' + device.os_version.replace(/\./g, '_')
							});
						});

						/** Generate Snapshot Group Markup from Template */
						var snapshot_markup = templates.snapshot({
							'count': i,
							'url_class': item.url_class,
							'date_class': item.date_class,
							'date_time': item.date_time,
							'url': item.url,
							'devices': device_markup
						});

						/** Reset Device Markup since we're in a loop */
						device_markup = '';

						/** Append Markup to Body */
						jQuery('body').append(snapshot_markup);
					});

					/** Render Date Filters using templates */
					jQuery.each(data.filters.dates, function(i, item){
						dates_filter_markup += templates.date_filter({
							'date_class': item.date_class,
							'date': item.select_date
						});
					});

					/** Append Markup */
					jQuery('.date_filter').prepend(dates_filter_markup);

					/** Render Device Model Filters using templates */
					jQuery.each(data.filters.urls, function(i, item){
						url_filter_markup += templates.url_filter({
							'url_class': item.url_class,
							'url': item.url
						});
					});

					/** Append Markup */
					jQuery('.url_filter').prepend(url_filter_markup);

					/** Render Filters using templates */
					jQuery.each(data.filters.operating_system, function(i, item){
						operating_systems_filter_markup += templates.operating_systems_filter({
							'os_class': item.os_class,
							'name': item.name
						});
						jQuery.each(item.versions, function(j, item_versions){
							operating_systems_filter_markup += templates.operating_systems_filter({
								'os_class': item_versions.id_class,
								'name': '&nbsp;&rsaquo; &nbsp;' + item_versions.id
							});
						});
					});

					/** Append Markup */
					jQuery('.os_filter').prepend(operating_systems_filter_markup);

					/** Now with everything rendered, lets init the GUI */
					snapshots.setup_gui();

					vars.ajax_call = null;
				},
				error: function(jqXHR, textStatus, errorThrown) {
					debug.error(errorThrown);
					vars.ajax_call = null;
				}
			});
		},

		/** Setup Graphic User Interface */
		setup_gui: function(){

			debug.info('snapshots.setup_gui();');

			jQuery('.selection').click(function(){
				jQuery('.selection i').removeClass('icon-ok').addClass('icon-filter');
				jQuery('i', this).removeClass('icon-filter').addClass('icon-ok');
			});
			jQuery('.clear-selection').click(function(){
				jQuery('.selection i').removeClass('icon-ok').addClass('icon-filter');
				snapshots.clear_filters();
			});

			jQuery('.btn, .remove').tooltip();

			jQuery('.remove').hover(
				function () {
					jQuery(this).addClass('btn-danger');
				},
				function () {
					jQuery(this).removeClass('btn-danger');
				}
			);

			jQuery('.btn').click(function(){
				jQuery('.btn').tooltip('hide');
			});

			jQuery('.fancybox').fancybox({
				closeBtn: false,
				loop: false,
				helpers:  {
					thumbs : {
						width: 50,
						height: 50
					}
				},
				beforeShow: function(){
					jQuery('#header, section').addClass('blur');
				},
				beforeClose: function(){
					jQuery('#header, section').removeClass('blur');
				}
			});

			jQuery('.page_previous').click(function(){
				return snapshots.page_previous();
			});

			jQuery('.page_next').click(function(){
				return snapshots.page_next();
			});

			jQuery('.filter_date').click(function(){
				return snapshots.filter_date('.');
			});

			jQuery('.filter_url').click(function(){
				return snapshots.filter_url('.');
			});

			jQuery('.filter_os').click(function(){
				return snapshots.filter_os('.');
			});

			jQuery('.clear_filters').click(function(){
				return snapshots.clear_filters();
			});

			jQuery('a[href*="#"]').live('click', function() {
				if ( this.hash ) {
					jQuery.bbq.pushState( '#/' + this.hash.slice(1) );
					return false;
				}
			});

			jQuery(window).bind('hashchange', function(event) {
				var tgt = location.hash.replace(/^#\/?/, '');
				if ( document.getElementById(tgt) ) {
					jQuery.smoothScroll({scrollTarget: '#' + tgt});
				}
			});

			var update_page = location.hash.replace('#/page', '');
			if(update_page !== '')
			{
				var current_page = parseInt(update_page, 10);
				snapshots.update_current_page(current_page);

				var prev_page = parseInt(current_page - 1, 10);
				if(prev_page < 1)
				{
					prev_page = 1;
				}

				var next_page = parseInt(current_page + 1, 10);
				if(next_page > vars.total_pages)
				{
					next_page = vars.total_pages;
				}
				jQuery('.page_previous').attr('href', '#page' + prev_page);
				jQuery('.page_next').attr('href', '#page' + next_page);
			}

			jQuery(window).trigger('hashchange');
		},

		/** Go to Previous Page */
		page_previous: function(){

			debug.info('snapshots.page_previous();');

			var this_page = vars.current_page;

			vars.current_page--;
			if(vars.current_page < 1)
			{
				vars.current_page = 1;
			}

			if(this_page != vars.current_page)
			{
				jQuery('.page_previous').attr('href', '#page' + vars.current_page);
				jQuery('.page_next').attr('href', '#page' + this_page);
			}
		},

		/** Go to Next Page */
		page_next: function(){

			debug.info('snapshots.page_next();');

			var this_page = vars.current_page;

			vars.current_page++;
			if(vars.current_page > vars.total_pages)
			{
				vars.current_page = vars.total_pages;
			}

			if(this_page != vars.current_page)
			{
				jQuery('.page_previous').attr('href', '#page' + this_page);
				jQuery('.page_next').attr('href', '#page' + vars.current_page);
			}
		},

		/**
		 * Filter Dates by Class Name
		 * @param string class_name Class Name
		 */
		filter_date: function(class_name){

			debug.info('snapshots.filter_date('+class_name+');');

			jQuery('section').hide();
			if(class_name !== '.')
			{
				jQuery('section' + class_name).fadeIn(vars.animation_speed);
			}
			else
			{
				jQuery('section').fadeIn(vars.animation_speed);
			}

			setTimeout(function(){ snapshots.check_for_empties(); }, parseInt(vars.animation_speed, 10)+100);

			return false;
		},

		/**
		 * Filter URL's by Class Name
		 * @param string class_name Class Name
		 */
		filter_url: function(class_name){

			debug.info('snapshots.filter_url('+class_name+');');

			jQuery('section').hide();
			if(class_name !== '.')
			{
				jQuery('section' + class_name).fadeIn(vars.animation_speed);
			}
			else
			{
				jQuery('section').fadeIn(vars.animation_speed);
			}

			setTimeout(function(){ snapshots.check_for_empties(); }, parseInt(vars.animation_speed, 10)+100);

			return false;
		},

		/**
		 * Filter Operating System by Class Name
		 * @param string class_name Class Name
		 */
		filter_os: function(class_name){

			debug.info('snapshots.filter_os('+class_name+');');

			jQuery('.device').hide();
			if(class_name !== '.')
			{
				jQuery('.devices ' + class_name).fadeIn(vars.animation_speed);
			}
			else
			{
				jQuery('.device').fadeIn(vars.animation_speed);
			}

			setTimeout(function(){ snapshots.check_for_empties(); }, parseInt(vars.animation_speed, 10)+100);

			return false;
		},

		/** After filters are set, see if any sections are empty, and hide them if they are */
		check_for_empties: function(){

			debug.info('snapshots.check_for_empties();');

			jQuery('section').each(function(i, item){
				if(jQuery('.device:visible', this).length === 0)
				{
					jQuery(this).fadeOut(vars.animation_speed);
				}
			});

			return false;
		},

		/** Clear Filters */
		clear_filters: function(){

			debug.info('snapshots.clear_filters();');

			snapshots.filter_date('.');
			snapshots.filter_url('.');
			snapshots.filter_os('.');

			jQuery('.selection i').removeClass('icon-ok').addClass('icon-filter');

			location.href = '#/page1';

			return false;
		},

		/**
		 * Prepare Deletion of Group
		 * @param int group Group Number to Delete
		 */
		prep_deletion: function(group){

			debug.info('snapshots.prep_deletion('+group+');');

			if(typeof group != 'undefined')
			{
				vars.selected_group = group;
			}

			return false;
		},

		/** Delete Group */
		delete_group: function(){

			debug.info('snapshots.delete_group();');

			jQuery('#confirm_delete').modal('hide');
			if(typeof vars.selected_group != 'undefined')
			{
				/** Abort any previous AJAX calls */
				if(vars.ajax_call)
				{
					vars.ajax_call.abort();
				}

				/** AJAX call to fetch Snapshots */
				vars.ajax_call = jQuery.ajax({
					url: 'snapshots.php',
					data: {
						'task': 'delete_snapshot_group',
						'group': vars.selected_group
					},
					dataType: 'json',
					cache: false,
					success: function(data) {
						if(data.errors.length > 0)
						{
							debug.error(data.errors);
							/** Render Date Filters using templates */
							jQuery.each(data.errors, function(i, item){
								jQuery('#error_message .modal-body').append('<p>'+item.message+'</p>');
							});
							jQuery('#error_message').modal('show');
							vars.ajax_call = null;

							return false;
						}

						document.location.reload(true);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						debug.error(errorThrown);
						vars.ajax_call = null;
					}
				});
			}

			return false;
		},

		/**
		 * Update Current Page
		 * @param int page Page Number
		 */
		update_current_page: function(page)
		{
			debug.info('snapshots.update_current_page('+page+');');

			vars.current_page = page;
		}
	};
})();

/** Initialize Snapshots */
if (window.addEventListener)
{
	window.addEventListener('load', snapshots.init, false);
}
else if (window.attachEvent)
{
	window.attachEvent('onload', snapshots.init);
}