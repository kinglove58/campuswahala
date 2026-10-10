# ADR 009: Automatic source-policy publication

Status: Accepted for Phase 1; supersedes ADR 006's manual-critical-review proposal.

Separate ingestion, strict extraction, entity matching and evidence storage from the server publication decision. Use normalized UUID catalogue entities, versioned facts and retained decisions. Controlled source authority/independence, strong confidence, category freshness and contradiction handling determine eligibility. Critical and academic facts publish automatically only from fresh official/institutional evidence. Cultural facts need at least two independent non-generated groups. Routine human approval is not required; authenticated exception overrides remain disabled.

Keep generated preview packs as fixtures. Bound ephemeral retrieval, prevent SSRF with pinned public addresses and conservative robots/policy enforcement, retain only limited structured evidence. Expire public visibility without deleting history. Feedback informs rechecks and weighted holds; never directly rewrites facts or supplies official authority. Shared abuse/replay/worker pacing, egress isolation and source policy review are public-deployment gates.


Phase 2.5 amendment (ADR 011): critical information requires literal `official` authority. The earlier institutional alternative is superseded.
