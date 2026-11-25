import { Button, Modal } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Section } from '@/components/ui/Section'
import type { ListingPhoto } from '@/lib/api/types/reviews'
import { REVIEW_COPY } from '@/lib/copy/review'

/**
 * A listing's photos (design 2026-11-24 §5.2): thumbnails that open a larger view with previous and next.
 * A moderated listing shows its label instead; too few photos is a hint, never a decision.
 */
export function ListingPhotos({
  photos,
  title,
  minimum,
  moderatedLabel,
}: {
  photos: ListingPhoto[]
  title: string
  minimum: number | null
  moderatedLabel: string | null
}) {
  const [open, setOpen] = useState<number | null>(null)
  const n = photos.length
  const alt = (i: number) => REVIEW_COPY.photoAlt(i + 1, n, title)

  return (
    <Section title="Photos">
      {moderatedLabel ? (
        <p className="text-body text-muted italic">{moderatedLabel}</p>
      ) : (
        <>
          {n === 0 ? (
            <p className="text-compact text-muted">{REVIEW_COPY.noPhotos}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, i) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    aria-label={`Open ${alt(i).charAt(0).toLowerCase()}${alt(i).slice(1)}`}
                    onClick={() => setOpen(i)}
                    className="block w-full overflow-hidden rounded-small border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                  >
                    <img
                      src={photo.url}
                      alt={alt(i)}
                      width={photo.width}
                      height={photo.height}
                      className="aspect-4/3 w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {minimum !== null && n < minimum && (
            <p className="text-compact text-muted">{REVIEW_COPY.belowMinimum(minimum)}</p>
          )}
        </>
      )}

      <Modal isOpen={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <Modal.Backdrop isDismissable>
          <Modal.Container size="lg">
            <Modal.Dialog className="rounded-card" aria-label={`Photos of ${title}`}>
              <Modal.Body>
                {open !== null && photos[open] && (
                  <img
                    src={photos[open].url}
                    alt={alt(open)}
                    width={photos[open].width}
                    height={photos[open].height}
                    className="h-auto max-h-[70dvh] w-full object-contain"
                  />
                )}
              </Modal.Body>
              <Modal.Footer className="flex items-center justify-between gap-2">
                <Button
                  variant="tertiary"
                  isDisabled={open === null || open === 0}
                  onPress={() => setOpen((i) => (i === null ? i : i - 1))}
                >
                  <ChevronLeft aria-hidden className="size-4" />
                  Previous photo
                </Button>
                <span className="text-compact text-muted tabular-nums" aria-hidden>
                  {open === null ? '' : `${open + 1} / ${n}`}
                </span>
                <Button
                  variant="tertiary"
                  isDisabled={open === null || open === n - 1}
                  onPress={() => setOpen((i) => (i === null ? i : i + 1))}
                >
                  Next photo
                  <ChevronRight aria-hidden className="size-4" />
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Section>
  )
}
