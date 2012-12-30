<?php
error_reporting(E_ALL ^ E_NOTICE);

/**
 * @package Adobe Edge Inspect
 * @author Peter Schmalfeldt <me@peterschmalfeldt.com>
 */

/**
 * Begin Document
 */
class Snapshots
{
  /**
   * Path to your snapshot. Needs to be publicly accessible for image viewing.
   * You can create an alias to your Adobe Edge Inspect with something like this:
   *
   * ln -s /Users/`whoami`/Documents/Edge\ Inspect /path/to/this/folder/snapshots
   *
   * I recommend creating an alias called "snapshots" in this projects folder
   */
  const PATH_TO_SNAPSHOTS = 'snapshots/';

  /**
   * Allowed Offset Seconds
   *
   * For grouping snapshots taken at the same time.
   * Snapshot files can have different URL's ( mobile version
   * might auto add hashtag, while desktop does not, for same initial URL )
   * and timestamps can be off by a few seconds from each
   * other since they are coming in at different times
   */
  const ALLOWED_OFFSET_SECONDS = 5;

  /**
   * Filters to use for Sorting
   */
  var $filters = array(
    'dates' => array(),
    'operating_system' => array(),
    'device_model' => array(),
    'device_res' => array(),
    'pixel_density' => array(),
    'urls' => array()
  );

  /**
   * Completed Sorted Files
   */
  var $grouped_files = array();

  /**
   * Build Snapshots from Directory
   */
  function __construct()
  {
    // Fetch a list of files in this directory, sort them by creation date in DESC order so newest are first
    $files = glob(self::PATH_TO_SNAPSHOTS . '*.txt');

    // If there were no files, then let's leave the function
    if(!$files)
    {
      return false;
    }

    // If there are files, then we can sort them for later use
    $files = array_reverse($files);

    // Setup some temp arrays for sorting
    $operating_system = '';
    $group_count = -1;
    $last_time = 0;

    // Loop through our files and create some arrays to store the data later
    foreach($files as $filename)
    {
      // Setup initial details
      $file = $filename;
      $image = str_replace('.txt', '.png', $file);
      $name = basename($file);

      // Do some RegEx for getting the date
      preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}\.[0-9]{2}\.[0-9]{2}/', $name, $matches);

      // Convert the date into something PHP can use
      $date = str_replace('_', ' ', $matches[0]);
      $date = str_replace('.', ':', $date);
      $select_date = date('F jS\, Y \(l\)', strtotime($date));
      $display_date = date('l\, F jS\, Y \@ g:i:s A', strtotime($date));

      // Get Device Name
      $raw_device = str_replace($matches[0].'_', '', $name);
      $raw_device = str_replace('.txt', '', $raw_device);

      $device = str_replace($matches[0].'_', '', $name);
      $device = str_replace('.txt', '', $device);
      $device = str_replace('_s_', '&rsquo;s ', $device);
      $device = str_replace('_', ' ', $device);

      // Get current file time
      $file_time = strtotime($date);

      // Check if this file was created around the same time as the last one
      if(abs($file_time - $last_time) > self::ALLOWED_OFFSET_SECONDS)
      {
        $group_count++;
        $this->grouped_files[$group_count] = array();
      }

      // Update last file time
      if($file_time != $last_time)
      {
        $last_time = $file_time;
      }

      // Do a quick check that the image actually exists, sometimes the file names are off by one second
      if( !file_exists($image))
      {
        $time = new DateTime($date);
        $time->modify("+1 second");

        $fixed_image = str_replace(' ', '_', $time->format('Y-m-d H:i:s'));
        $fixed_image = self::PATH_TO_SNAPSHOTS . str_replace(':', '.', $fixed_image) . '_' . $raw_device . '.png';

        if(file_exists($fixed_image))
        {
          $image = $fixed_image;
        }
        else
        {
          $time = new DateTime($date);
          $time->modify("-2 second");

          $fixed_image = str_replace(' ', '_', $time->format('Y-m-d H:i:s'));
          $fixed_image = self::PATH_TO_SNAPSHOTS . str_replace(':', '.', $fixed_image) . '_' . $raw_device . '.png';

          if(file_exists($fixed_image))
          {
            $image = $fixed_image;
          }
        }
      }

      // Capture the date in the TXT file and store it to an array with some other info
      $temp_array = array();
      if (file_exists($filename))
      {
        // Set some data we already know
        $temp_array['device'] = $device;
        $temp_array['image'] = $image;
        $temp_array['date'] = $date;
        $temp_array['select_date'] = $select_date;
        $temp_array['display_date'] = $display_date;
        $temp_array['data_file'] = $file;

        $found_date_filter = false;
        foreach($this->filters['dates'] as $filter_date)
        {
          if($filter_date['select_date'] == $select_date)
          {
            $found_date_filter = true;
          }
        }

        if( !$found_date_filter)
        {
          $this->filters['dates'][] = array(
            'date' => $date,
            'select_date' => $select_date,
            'display_date' => $display_date,
            'date_class' => 'date_' . md5($select_date)
          );
        }

        // Open the text file to get the snapshot info
        $fp = fopen($filename, 'r') or die("Couldn't open $filename");
        while ( !feof($fp))
        {
          $line = str_replace("\n", '', fgets($fp, 1024));
          list($key, $value) = explode(' = ', $line, 2);
          if( !empty($key))
          {
            switch($key)
            {
              case 'os_name':
                if( !$this->_search($this->filters['operating_system'], 'name', $value))
                {
                  $this->filters['operating_system'][] = array(
                    'name' => $value,
                    'os_class' => strtolower(str_replace(' ', '_', $value)),
                    'versions' => array()
                  );
                }
                $operating_system = $value;
                break;

              case 'os_version':
                foreach($this->filters['operating_system'] as $id => $os)
                {
                  if($os['name'] == $operating_system)
                  {
                    if( !in_array($value, $os['versions']))
                    {
                      $found_version_filter = false;
                      foreach($this->filters['operating_system'][$id]['versions'] as $version)
                      {
                        if($version['id'] == $value)
                        {
                          $found_version_filter = true;
                        }
                      }

                      if( !$found_version_filter)
                      {
                        $this->filters['operating_system'][$id]['versions'][] = array(
                          'id' => $value,
                          'id_class' => strtolower(str_replace(' ', '_', $operating_system)) . '_version_' . strtolower(str_replace('.', '_', $value))
                        );
                      }
                    }
                  }
                }
                break;

              case 'device_model':
                if( !in_array($value, $this->filters['device_model']))
                {
                  $this->filters['device_model'][] = $value;
                }
                break;

              case 'device_res':
                if( !in_array($value, $this->filters['device_res']))
                {
                  $this->filters['device_res'][] = $value;
                }
                break;

              case 'pixel_density':
                if( !in_array($value, $this->filters['pixel_density']))
                {
                  $this->filters['pixel_density'][] = $value;
                }
                break;
            }

            $temp_array[$key] = $value;
          }
        }
      }

      $found_url_filter = false;
      foreach($this->filters['urls'] as $filter_url)
      {
        if($filter_url['url'] == $temp_array['url'])
        {
          $found_url_filter = true;
        }
      }

      if( !$found_url_filter)
      {
        $this->filters['urls'][] = array(
          'url' => $temp_array['url'],
          'url_class' => 'url_' . md5($temp_array['url'])
        );
      }

      // Create new group to store device info
      if( !isset($this->grouped_files[$group_count]['devices']))
      {
        $this->grouped_files[$group_count] = array(
          'group' => ($group_count+1),
          'group_class' => 'group_' . ($group_count+1),
          'url' => $temp_array['url'],
          'url_class' => 'url_' . md5($temp_array['url']),
          'date' => $temp_array['select_date'],
          'date_class' => 'date_' . md5($temp_array['select_date']),
          'date_time' => $temp_array['display_date'],
          'select_date' => $temp_array['select_date'],
          'device_count' => 1,
          'devices' => array($temp_array)
        );
      }
      // Group already exists, so just add new info
      else
      {
        $this->grouped_files[$group_count]['devices'][] = $temp_array;
        $this->grouped_files[$group_count]['device_count']++;
      }
    }
  }

  /**
   * Get Snapshots
   */
  public function get_snapshots()
  {
    // Check if we can get the real path, otherwise we do not have permission for the parent folder to do anything
    if ( !realpath(self::PATH_TO_SNAPSHOTS))
    {
      $errors[] = array('message' => '<b style="color: red;">Invalid Parent Folder Permissions.</b><br />CHMOD <b>' . self::PATH_TO_SNAPSHOTS . '</b>\'s Parent Folder to <b>755</b> to fix this issue.');

      $return = array(
        'errors' => $errors,
        'snapshots' => array(),
        'filters' => array()
      );

      return json_encode($return);
    }

    // Check if the folder is readable, otherwise we cannot get the directory listing
    if ( !is_readable(self::PATH_TO_SNAPSHOTS))
    {
      $errors[] = array('message' => '<b style="color: red;">Invalid Folder Permissions.</b><br />CHMOD <b>' . realpath(self::PATH_TO_SNAPSHOTS) . '</b> to <b>755</b>.');

      $return = array(
        'errors' => $errors,
        'snapshots' => array(),
        'filters' => array()
      );

      return json_encode($return);
    }

    // Prepare an Object to return
    $return = array(
      'errors' => array(),
      'snapshots' => $this->grouped_files,
      'filters' => $this->filters
    );

    // Convert to JSON
    return json_encode($return);
  }

  /**
   * Delete Snapshots from Group
   */
  public function delete_snapshot_group($group_id)
  {
    $errors = array();
    $removed_files = array();

    // Check if parent directory is writable, otherwise we cannot delete the files
    if ( !is_writable(self::PATH_TO_SNAPSHOTS)) {

      $errors[] = array('message' => 'Invalid Permissions to Delete Files. CHMOD <b>' . realpath(self::PATH_TO_SNAPSHOTS) . '</b> to <b>777</b> to fix this issue.');

      $return = array(
        'errors' => $errors,
        'removed_files' => $removed_files
      );

      return json_encode($return);
    }

    foreach($this->grouped_files[$group_id]['devices'] as $device)
    {
      // Remove Image File
      $image_file = html_entity_decode($device['image'], ENT_QUOTES | ENT_IGNORE, 'UTF-8');
      if(file_exists($image_file))
      {
        chmod($image_file, 0666);
        unlink($image_file);
        $removed_files[] = $device['image'];
      }

      // Remove Text File
      $text_file = html_entity_decode($device['data_file'], ENT_QUOTES | ENT_IGNORE, 'UTF-8');
      if(file_exists($text_file))
      {
        chmod($text_file, 0666);
        unlink($text_file);
        $removed_files[] = $device['data_file'];
      }
    }

    $return = array(
      'errors' => $errors,
      'removed_files' => $removed_files
    );

    return json_encode($return);
  }

  /**
   * Custom Array Search function
   *
   * @param array $array Array to use
   * @param string $key Array key to use
   * @param string $value Value we are looking for
   *
   * @access private
   */
  private function _search($array, $key, $value)
  {
    $results = array();

    if (is_array($array))
    {
      if (isset($array[$key]) && $array[$key] == $value)
      {
        $results[] = $array;
      }

      foreach ($array as $subarray)
      {
        $results = array_merge($results, $this->_search($subarray, $key, $value));
      }
    }

    return $results;
  }
}

$snapshots = new Snapshots();

switch($_GET['task'])
{
  case 'get_snapshots':
    echo $snapshots->get_snapshots();
    break;

  case 'delete_snapshot_group':
    if(isset($_GET['group']))
    {
      echo $snapshots->delete_snapshot_group($_GET['group']);
    }
    break;
}

/* End of file snapshots.php */