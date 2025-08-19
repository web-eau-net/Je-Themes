<?php
defined('_JEXEC') or die;

use Joomla\CMS\Installer\InstallerScript;
use Joomla\CMS\Factory;

class PlgSystemMonpluginInstallerScript extends InstallerScript
{

    public function postflight($type, $parent)
    {
        // check if it's an install, not an update
        if ($type == 'install') {
            $this->enablePlugin();
        }
    }

    /**
     * Publish the plugin after installatio
     */
    private function enablePlugin()
    {
        $db = Factory::getDbo();
        $query = $db->getQuery(true);
        
        $query->update('#__extensions')
              ->set($db->quoteName('enabled') . ' = 1')
              ->where($db->quoteName('element') . ' = ' . $db->quote('je-theme'))
              ->where($db->quoteName('type') . ' = ' . $db->quote('plugin'))
              ->where($db->quoteName('folder') . ' = ' . $db->quote('installer'));
        
        $db->setQuery($query);
        
        try {
            $db->execute();
            Factory::getApplication()->enqueueMessage('Plugin activé automatiquement', 'message');
        } catch (Exception $e) {
            Factory::getApplication()->enqueueMessage('Erreur lors de l\'activation du plugin: ' . $e->getMessage(), 'error');
        }
    }
}
?>