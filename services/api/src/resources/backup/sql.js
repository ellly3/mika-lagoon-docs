// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectBackup: id =>
    knex('environment_backup')
      .where('id', '=', id)
      .toString(),
  selectBackupByBackupId: (backupId /* : number */) =>
    knex('environment_backup')
      .where('backup_id', '=', backupId)
      .toString(),
  selectBackupsByEnvironmentId: ({ environmentId } /* : { environmentId: number} */) =>
    knex('environment_backup')
      .join('environment as e', 'e.id', '=', 'environment_backup.environment')
      .select(
        'environment_backup.*',
      )
      .where('e.id', environmentId)
      .toString(),
  insertBackup: ({
    id, environment, source, backupId, created,
  } /* : {id: number, environment: number, source: string, backupId: string, created: string} */) =>
    knex('environment_backup')
      .insert({
        id,
        environment,
        source,
        backup_id: backupId,
        created,
      })
      .toString(),
  truncateBackup: () =>
    knex('environment_backup')
      .truncate()
      .toString(),
  selectRestore: (id /* : number */) =>
    knex('backup_restore')
      .where('id', '=', id)
      .toString(),
  selectRestoreByBackupId: (backupId /* : string */) =>
    knex('backup_restore')
      .where('backup_id', backupId)
      .toString(),
  insertRestore: ({
    id, backupId, status, restoreLocation, created,
  } /* : {id: number, backupId: string, status: string, restoreLocation: string, created: string} */) =>
    knex('backup_restore')
      .insert({
        id,
        backupId,
        status,
        restoreLocation,
        created,
      })
      .toString(),
  updateRestore: ({ backupId, patch } /* : {id: string, patch: Object} */) =>
    knex('backup_restore')
      .where('backup_id', backupId)
      .update(patch)
      .toString(),
  selectPermsForRestore: (backupId /* : string */) =>
    knex('backup_restore')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('environment_backup', 'backup_restore.backup', '=', 'environment_backup.id')
      .join('environment', 'environment_backup.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('backup_restore.backup_id', backupId)
      .toString(),
  selectPermsForBackup: (backupId /* : string */) =>
    knex('environment_backup')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('environment', 'environment_backup.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment_backup.backup_id', backupId)
      .toString(),
};

module.exports = Sql;