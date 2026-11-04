<?php
// Updates come from the plugin's GitHub repository: the .plg on its "release" branch, the same
// file Unraid's Plugins page checks (pluginURL in the .plg). plugin/release.py puts each new
// version there, so publishing an update needs no GitHub release, only a push.
// Used by include/check-update.php ("Check for updates") and scripts/autoupdate.php.

const AURORA_PLUGIN = 'Aurora-Theme';
const AURORA_REPO = '@@GITHUB_REPO@@';
const AURORA_RELEASE_PLG = 'https://raw.githubusercontent.com/' . AURORA_REPO . '/release/' . AURORA_PLUGIN . '.plg';
const AURORA_RELEASES_PAGE = 'https://github.com/' . AURORA_REPO . '/commits/release';

/** One setting: the user's value, else the plugin's default (as Unraid's parse_plugin_cfg() does). */
function aurora_setting(string $key): string
{
    static $settings = null;
    if ($settings === null) {
        $defaults = @parse_ini_file('/usr/local/emhttp/plugins/' . AURORA_PLUGIN . '/default.cfg') ?: [];
        $user = @parse_ini_file('/boot/config/plugins/' . AURORA_PLUGIN . '/' . AURORA_PLUGIN . '.cfg') ?: [];
        $settings = array_merge($defaults, $user);
    }
    return (string) ($settings[$key] ?? '');
}

/**
 * When automatic updates run: ['cron' => cron time fields, 'text' => "every day at 03:00"].
 * Settings: autoupdate_when (hourly, daily, weekly), autoupdate_day (0 Sunday ... 6 Saturday),
 * autoupdate_time (HH:MM, for daily and weekly).
 */
function aurora_update_schedule(): array
{
    $when = aurora_setting('autoupdate_when');
    if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', aurora_setting('autoupdate_time'), $time)) $time = ['', '03', '00'];
    $day = preg_match('/^[0-6]$/', aurora_setting('autoupdate_day')) ? (int) aurora_setting('autoupdate_day') : 0;
    $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    $minute = (int) $time[2];
    $hour = (int) $time[1];
    if ($when === 'daily') return ['cron' => "$minute $hour * * *", 'text' => "every day at {$time[1]}:{$time[2]}"];
    if ($when === 'weekly') return ['cron' => "$minute $hour * * $day", 'text' => "every {$days[$day]} at {$time[1]}:{$time[2]}"];
    return ['cron' => '23 * * * *', 'text' => 'every hour'];
}

/** Version in a .plg file, or '' when the file is not this plugin. */
function aurora_plg_version(string $file): string
{
    $xml = is_file($file) ? @simplexml_load_file($file) : false;
    return $xml && (string) $xml['name'] === AURORA_PLUGIN ? (string) $xml['version'] : '';
}

function aurora_installed_version(): string
{
    return aurora_plg_version('/boot/config/plugins/' . AURORA_PLUGIN . '.plg');
}

/**
 * The newest release: ['version' => '2026.10.23.1200', 'page' => its history, 'plg' => URL of
 * its .plg] or ['error' => text]. Read from the .plg on the "release" branch, a few kilobytes
 * served by GitHub's CDN in one request.
 */
function aurora_latest_release(): array
{
    $file = tempnam('/tmp', 'aurora-release-');
    // The query string only gets past caches that would hand out a file a few minutes old.
    exec('/usr/bin/curl -fsSL --retry 2 --max-time 90 -A ' . escapeshellarg(AURORA_PLUGIN . '-update-check')
        . ' -o ' . escapeshellarg($file) . ' ' . escapeshellarg(AURORA_RELEASE_PLG . '?t=' . time()) . ' 2>&1', $download, $status);
    $version = $status === 0 ? aurora_plg_version($file) : '';
    @unlink($file);
    if ($version !== '') {
        return ['version' => $version, 'page' => AURORA_RELEASES_PAGE, 'plg' => AURORA_RELEASE_PLG];
    }
    return ['error' => $status === 0
        ? 'The release branch on GitHub has no valid ' . AURORA_PLUGIN . '.plg.'
        : 'GitHub could not be reached: ' . trim(implode(' ', $download))];
}
