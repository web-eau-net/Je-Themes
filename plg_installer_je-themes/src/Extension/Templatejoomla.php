<?php
/**
 * @package     Joomla.Plugin
 * @subpackage  Installer.Templatejoomla
 *
 * @copyright   Copyright (C) 2025 web-eau-net. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Installer\Templatejoomla\Extension;

defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Version;
use Joomla\Event\Event;
//use Joomla\Event\SubscriberInterface;

/**
 * Plugin Installer: Adds a "Templates Joomla" tab in Extensions → Install → Install from the Web.
 * Compatible Joomla 4/5.
 * Uncomment the commented code and remove onInstallerAddInstallationTab() to make it compatible with Joomla 6
 */
final class Templatejoomla extends CMSPlugin /*implements SubscriberInterface*/
{
    /**
     * The URL for the remote server.
     *
     * @var    string
     * @since  4.0.0
     */
    public const REMOTE_URL = 'https://raw.githubusercontent.com/web-eau-net/templatejoomla-data/main/';

    /**
     * Load plugin language files automatically
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return  array
     */
    /*public static function getSubscribedEvents(): array
    {
        return [
            'onInstallerAddInstallationTab' => 'onInstallerAddInstallationTab',
        ];
    }*/

    /**
     * Event listener for the `onInstallerAddInstallationTab` event.
     *
     * @return  array  Returns an array with the tab information
     */
    public function onInstallerAddInstallationTab(): array
    {
        $tab = $this->addTemplateTab();
        return $tab;
    }

    /**
     * Adds our tab to com_installer via onInstallerAddInstallTab
     *
     * @param   Event  $event  The event object
     *
     * @return  void
     */
    /*public function onInstallerAddInstallationTab(\Joomla\CMS\Event\Installer\AddInstallationTabEvent $event): void
    {
        $tab = $this->addTemplateTab();
        $event->addResult($tab);
    }*/

    private function addTemplateTab(): array
    {
        // Load language files
        $this->loadLanguage();

        $doc  = $this->getApplication()->getDocument();
        $lang = $this->getApplication()->getLanguage();

        $wa  = $doc->getWebAssetManager();

        $wa->registerAndUseScript(
            'plg_installer_templatejoomla.script',
            'media/plg_installer_templatejoomla/js/app.js',
            [],
            ['defer' => true],
            ['core']
        );

        $wa->registerAndUseStyle(
            'plg_installer_templatejoomla.style',
            'media/plg_installer_templatejoomla/css/app.css'
        );

        $config = [
            'endpoint' => self::REMOTE_URL . 'templates.json',
            'texts' => [
                'loading' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_LOADING'),
                'search' => Text::_('JSEARCH_FILTER'),
                'searchPlaceholder' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SEARCH_PLACEHOLDER'),
                'category' => Text::_('JCATEGORY'),
                'allCategories' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ALL_CATEGORIES'),
                'reset' => Text::_('JSEARCH_FILTER_CLEAR'),
                'noResults' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_NO_RESULTS'),
                'errorLoading' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ERROR_LOADING'),
                'liveDemo' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_LIVE_DEMO'),
                'learnMore' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_LEARN_MORE'),
                'sortBy' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_BY'),
                'sortAlpha' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_ALPHA'),
                'sortUpdated' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_UPDATED'),
                'sortAdded' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_SORT_ADDED'),
                'joomlaVersion' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_JOOMLA_VERSION'),
                'currentVersion' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_CURRENT_VERSION'),
                'allVersions' => Text::_('PLG_INSTALLER_TEMPLATEJOOMLA_ALL_VERSIONS'),
            ]
        ];

        $wa->addInlineScript(
            'window.TJ_CONFIG = ' . json_encode($config, JSON_UNESCAPED_SLASHES) . ';',
            [],
            ['type' => 'text/javascript']
        );

        $options = [
            'version' => Version::MAJOR_VERSION,
        ];

        $doc->addScriptOptions('js-templatejoomla', $options);

        $tab = [
            'name'  => 'templatejoomla',
            'label' => $lang->_('PLG_INSTALLER_TEMPLATEJOOMLA_TAB_TITLE'),
        ];

        // Render the input
        ob_start();
        include PluginHelper::getLayoutPath('installer', 'templatejoomla');
        $tab['content'] = ob_get_clean();
        $tab['content'] = '<legend>' . $tab['label'] . '</legend>' . $tab['content'];

        return $tab;
    }
}