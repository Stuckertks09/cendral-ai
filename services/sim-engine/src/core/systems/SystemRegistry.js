// src/core/systems/SystemRegistry.js

export default class SystemRegistry {
  constructor({ worldState, settings }) {
    this.worldState = worldState;           // current world snapshot
    this.settings = settings;               // global & system config
    this.systems = [];                      // registered systems
    this.enabled = new Set();               // enabled system names
  }

  /**
   * Register a system class.
   * System must implement:
   *   - name (static or instance property)
   *   - update(event) or updateStep()
   */
  register(SystemClass, options = {}) {
    const instance = new SystemClass(
      this.worldState,
      this.settings[SystemClass.name] || {},
      options
    );

    const name = SystemClass.name;

    this.systems.push({ name, instance });
    this.enabled.add(name);

    return this;
  }

  /**
   * Disable a specific system dynamically.
   */
  disable(name) {
    this.enabled.delete(name);
  }

  /**
   * Enable a system dynamically.
   */
  enable(name) {
    this.enabled.add(name);
  }

  /**
   * Called each simulation step.
   * The event may be null if no external trigger.
   */
  update(event = null) {
    for (const { name, instance } of this.systems) {
      if (!this.enabled.has(name)) continue;

      if (typeof instance.update === "function") {
        instance.update(event);
      }
    }
  }

  updateSettings(newSettings) {
  this.settings = { ...this.settings, ...newSettings };

  // Push to each system
  for (const { instance } of this.systems) {
    if (instance.settings) {
      instance.settings = {
        ...instance.settings,
        ...(newSettings[instance.constructor.name] || {})
      };
    }
  }
}

  /**
   * Swap worldState after world cloning (step → step+1)
   */
  bindWorldState(newWorldState) {
    this.worldState = newWorldState;
    this.systems.forEach(({ instance }) => {
      if (typeof instance.bindWorldState === "function") {
        instance.bindWorldState(newWorldState);
      }
    });
  }
}
