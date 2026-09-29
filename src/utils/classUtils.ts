import { SchoolClass } from '../types';

/**
 * Normalizes Persian/Arabic strings, digits, and spaces for resilient class matching
 */
export function normalizeClassString(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .toString()
    .trim()
    // Remove half-spaces, zero-width spaces, and extra whitespace
    .replace(/[\u200B-\u200D\uFEFF\s]+/g, '')
    // Convert Persian digits to English
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    // Convert Arabic digits to English
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    // Unify Arabic / Persian Yeh and Kaf
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/آ/g, 'ا')
    .toLowerCase();
}

/**
 * Dynamically resolves the accurate, current class name for a student/user
 * Checks matching by class ID, exact name, trimmed name, or normalized name against active schoolClasses.
 */
export function resolveUserClassName(
  rawClassNameOrId: string | undefined | null,
  schoolClasses?: SchoolClass[] | null,
  fallback: string = 'نامشخص'
): string {
  if (!rawClassNameOrId || !rawClassNameOrId.trim()) {
    return fallback;
  }

  const raw = rawClassNameOrId.trim();

  if (!schoolClasses || schoolClasses.length === 0) {
    return raw;
  }

  // 1. Direct match by class ID
  const matchById = schoolClasses.find((c) => c.id === raw);
  if (matchById) {
    return matchById.name;
  }

  // 2. Direct exact match by class name
  const matchExact = schoolClasses.find((c) => c.name === raw || c.name.trim() === raw);
  if (matchExact) {
    return matchExact.name;
  }

  // 3. Normalized match (ignores spacing, Persian/Arabic digit differences, Yeh/Kaf)
  const normRaw = normalizeClassString(raw);
  const matchNorm = schoolClasses.find((c) => normalizeClassString(c.name) === normRaw);
  if (matchNorm) {
    return matchNorm.name;
  }

  // 4. Prefix/Suffix fuzzy match if only one class matches closely
  const fuzzyMatches = schoolClasses.filter((c) => {
    const normClass = normalizeClassString(c.name);
    return normClass.includes(normRaw) || normRaw.includes(normClass);
  });
  if (fuzzyMatches.length === 1) {
    return fuzzyMatches[0].name;
  }

  // 5. Fallback to raw string
  return raw;
}
