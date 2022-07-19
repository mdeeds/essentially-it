export class S {
  private static cache = new Map<string, number>();
  private static default = new Map<string, number>();
  private static description = new Map<string, string>();

  static setDefault(key: string, value: number, description: string) {
    S.default.set(key, value);
    S.description.set(key, description)
  }

  static appendHelpText(container: HTMLElement) {
    const helpText = document.createElement('div');
    for (const k of S.default.keys()) {
      const d = document.createElement('div');
      const desc = S.description.get(k);
      const val = S.float(k);
      d.innerText = (`${k} = ${val}: ${desc}`);
      helpText.appendChild(d);
    }
    container.appendChild(helpText);
  }

  static {
    S.setDefault('last change', 3, 'Grip hands.');
    S.setDefault('aa', Math.PI / 4, 'Acceleration angle.');
    S.setDefault('ba', 100, 'Blobby stick sensitivity (acceleration)');
    S.setDefault('bf', 0.1, 'Blobby friction');
    S.setDefault('bh', 0.1, 'Heat of brownian motion.  1.0 = white.');
    S.setDefault('dr', -0.3, 'Rotation if you are off center.');
    S.setDefault('ep', 4, 'Episode number');
    S.setDefault('ga', 10.0, 'Grab acceleration.')
    S.setDefault('ha', 1.5, 'Hand angle (radians)');
    S.setDefault('hm', 1.0, 'Multiplier for highest note.')
    S.setDefault('lm', 3.0, 'Multiplier for lowest note.');
    S.setDefault('ma', 20.0, 'Max player acceleration.');
    S.setDefault('mi', 6, 'Mandelbrot iterations.');
    S.setDefault('ns', 100000, 'Number of stars in home starfield.');
    S.setDefault('mr', 2, 'Minimum star radius.');
    S.setDefault('pi', 30, 'Pen initial thickness.');
    S.setDefault('pf', 15, 'Pen final thickness');
    S.setDefault('s', 0.15, 'Smoothness, lower = more smooth.');
    S.setDefault('sh', 0, '0 = lab, 1 = home, 2 = conduit');
    S.setDefault('si', 0.9, 'Star intensity');
    S.setDefault('shf', 10.0, 'Super-human jump factor.');
    S.setDefault('sr', 10000, 'Radius of the starfield.');
    S.setDefault('zy', 1.1, 'Zig-Zag height');
  }

  public static float(name: string): number {
    if (S.cache.has(name)) {

      return S.cache.get(name);
    }
    const url = new URL(document.URL);
    const stringVal = url.searchParams.get(name);
    if (!stringVal) {
      S.cache.set(name, S.default.get(name));
    } else {
      const val = parseFloat(stringVal);
      S.cache.set(name, val);
    }
    return S.cache.get(name);
  }
}