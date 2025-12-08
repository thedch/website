/**
 * Beautiful interactive footnotes with rich hover tooltips
 */

interface FootnoteElements {
  ref: HTMLElement;
  definition: HTMLElement | null;
  tooltip: HTMLDivElement | null;
}

function initFootnotes() {
  const article = document.querySelector('article');
  if (!article) return;

  // Find all footnote references
  const footnoteRefs = article.querySelectorAll<HTMLElement>('[data-footnote-ref]');

  // Find the footnotes section
  const footnotesSection = article.querySelector('.footnotes');
  if (!footnotesSection) return;

  const footnoteItems = footnotesSection.querySelectorAll<HTMLLIElement>('li');

  // Process each footnote reference
  footnoteRefs.forEach((ref) => {
    const footnoteId = ref.getAttribute('data-footnote-id');
    if (!footnoteId) return;

    // Find corresponding footnote definition
    const footnoteItem = Array.from(footnoteItems).find(
      (li) => li.id === `user-content-fn-${footnoteId}`
    );

    if (!footnoteItem) return;

    // Create tooltip element
    const tooltip = createTooltip(footnoteId, footnoteItem);

    // Insert tooltip into the reference
    ref.appendChild(tooltip);

    // Add hover listeners
    let hideTimeout: number | null = null;

    ref.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      tooltip.classList.add('show');
    });

    ref.addEventListener('mouseleave', () => {
      hideTimeout = window.setTimeout(() => {
        tooltip.classList.remove('show');
      }, 150);
    });
  });
}

function createTooltip(footnoteId: string, footnoteItem: HTMLLIElement): HTMLDivElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'footnote-tooltip';

  // Get footnote content (excluding the back-reference)
  const content = document.createElement('div');
  content.className = 'footnote-tooltip-content';

  // Clone the footnote content but remove the back-reference
  const clonedContent = footnoteItem.cloneNode(true) as HTMLLIElement;
  const backRef = clonedContent.querySelector('.data-footnote-backref');
  if (backRef) {
    backRef.remove();
  }

  // Get the text content
  content.innerHTML = clonedContent.innerHTML;

  tooltip.appendChild(content);

  return tooltip;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFootnotes);
} else {
  initFootnotes();
}

// Re-initialize on Astro page transitions (if using View Transitions)
document.addEventListener('astro:page-load', initFootnotes);
