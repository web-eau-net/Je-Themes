<?php
/**
 * @package     Joomla.Plugin
 * @subpackage  Installer.Templatejoomla
 *
 * @copyright   Copyright (C) 2025 web-eau-net. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die();

use Joomla\CMS\Language\Text;

/** @var \Joomla\Plugin\Installer\Templatejoomla\Extension\Templatejoomla $this */
?>
<div id="tj-container" class="tab-pane">

	<?php // Main content ?>
	<div id="tj-content">

	    <?php // Toolbar with filters and sorting ?>
		<div class="row g-3 mb-4 align-items-end">

		    <?php // Search ?>
			<div class="col-md-4">
				<label for="tj-search" class="form-label"><?php echo Text::_('JSEARCH_FILTER'); ?></label>
				<input type="search" class="form-control" id="tj-search"
					placeholder="<?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SEARCH_PLACEHOLDER'); ?>" />
			</div>

			<?php // Category filter ?>
			<div class="col-md-3">
				<label for="tj-category" class="form-label"><?php echo Text::_('JCATEGORY'); ?></label>
				<select id="tj-category" class="form-select">
					<option value=""><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ALL_CATEGORIES'); ?></option>
				</select>
			</div>

			<?php // Joomla version filter ?>
			<div class="col-md-2">
				<label for="tj-version" class="form-label"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_JOOMLA_VERSION'); ?></label>
				<select id="tj-version" class="form-select">
					<option value="current"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_CURRENT_VERSION'); ?></option>
					<option value="all"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ALL_VERSIONS'); ?></option>
				</select>
			</div>

			<?php // Sort options ?>
			<div class="col-md-2">
				<label for="tj-sort" class="form-label"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_BY'); ?></label>
				<select id="tj-sort" class="form-select">
					<option value="alpha"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_ALPHA'); ?></option>
					<option value="updated"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_UPDATED'); ?></option>
					<option value="added"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_ADDED'); ?></option>
				</select>
			</div>

			<?php // Reset button ?>
			<div class="col-md-1 d-grid">
				<button id="tj-reset" class="btn btn-secondary"
					title="<?php echo Text::_('JSEARCH_FILTER_CLEAR'); ?>">
					<span class="icon-refresh" aria-hidden="true"></span>
				</button>
			</div>

		</div>

		<?php // Results count and pagination info ?>
		<div id="tj-info" class="mb-3 text-muted small d-none"></div>

		<?php // Results grid ?>
		<div id="tj-results" class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3"></div>

		<?php // Load more button (for pagination) ?>
		<div class="text-center mt-4">
			<button id="tj-load-more" class="btn btn-outline-primary d-none"><?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_LOADMORE'); ?></button>
		</div>

		<?php // Status messages ?>
		<div id="tj-empty" class="alert alert-info mt-3 d-none">
			<span class="icon-info-circle" aria-hidden="true"></span>
            <?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_NO_RESULTS') ?>
		</div>

        <?php // Error messages ?>
		<div id="tj-error" class="alert alert-danger mt-3 d-none">
			<span class="icon-warning" aria-hidden="true"></span>
            <?php echo Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ERROR_LOADING'); ?>
		</div>
	</div><?php // end tj-content ?>
</div><?php // end tj-container ?>
