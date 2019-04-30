export default {
  core: {
    openEmptyEditorOnStart: {
      type: 'boolean',
      description:
        'When checked opens an untitled editor when loading a blank environment (such as with _File > New Window_ or when **Restore Previous Windows On Start** is unchecked); otherwise no editor is opened when loading a blank environment. This setting has no effect when restoring a previous state.',
      default: true
    },
    restorePreviousWindowsOnStart: {
      type: 'string',
      enum: ['no', 'yes', 'always'],
      default: 'yes',
      description:
        "When selected 'no', a blank environment is loaded. When selected 'yes' and Vision is started from the icon, restores the last state of Vision window; otherwise a blank environment is loaded. When selected 'always', restores the last state of Vision window always, no matter how Vision is started."
    },
    reopenProjectMenuCount: {
      type: 'integer',
      default: 15,
      description: 'How many recent projects to show in the _Reopen Project_ menu.'
    },
    automaticallyUpdate: {
      type: 'boolean',
      default: true,
      description: 'Automatically update Vision when a new release is available.'
    },
    warnOnLargeFileLimit: {
      type: 'number',
      default: 40,
      description: 'Warn before opening files larger than this number of megabytes.'
    }
  },
  editor: {
    showLineNumbers: {
      type: 'boolean',
      default: true,
      description: "Show line numbers in the editor's gutter."
    }
  }
}
