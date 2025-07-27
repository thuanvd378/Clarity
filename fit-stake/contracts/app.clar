;; ------------------------------------------------------------
;; FitStake Challenge Board Contract (Stacks / Clarity)
;; ------------------------------------------------------------
;; Stores fitness challenges so a React front-end (see App.jsx)
;; can create and list them.
;; Contract name: message-board
;; ------------------------------------------------------------

;; -------------------- Data Structures ----------------------

(define-map challenges uint
  (tuple
    (content          (string-utf8 280))
    (participants     uint)
    (max_participants uint)
    (entry_fee        uint)
    (reward           uint)
    (confirmed        bool)
  )
)

;; Auto-incrementing counter for challenge ids
(define-data-var challenge-count uint u0)

;; -------------------- Public Functions ---------------------

;; create-challenge-full
;; (string content, uint max_participants, uint entry_fee
(define-public (create-challenge-full
                 (content          (string-utf8 280))
                 (max-participants uint)
                 (entry-fee        uint)
                 (reward           uint)
                 (confirmed        bool)
               )
  (begin
    ;; next id = current count + 1
    (let ((id (+ (var-get challenge-count) u1)))
      ;; store the challenge
      (map-set challenges id {
        content:          content,
        participants:     u0,
        max_participants: max-participants,
        entry_fee:        entry-fee,
        reward:           reward,
        confirmed:        confirmed
      })
      ;; update counter
      (var-set challenge-count id)
      ;; return the new id
      (ok id)
    )
  )
)

;; -------------------- Read-Only Functions ------------------

;; Total number of challenges created so far
(define-read-only (get-challenge-count)
  (var-get challenge-count)
)

;; Get details for a specific challenge id
(define-read-only (get-challenge (id uint))
  (map-get? challenges id)
)
