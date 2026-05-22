"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, FileText, ImagePlus, Landmark, MapPin, Save, ShieldCheck } from "lucide-react";
import { campaignsApi, type CampaignDriveApi } from "@/lib/api";

const categories = ["Medical", "Relief", "Education", "Community", "Animal Rescue", "Disaster Relief"];

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDriveApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("Medical");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    campaignsApi
      .mine()
      .then((res) => {
        if (!active) return;
        const owned = res.data.data.find((item) => item.id === params.id);
        if (!owned) {
          toast.error("Campaign not found or you do not have permission to edit it.");
          router.replace("/donor#organized-drives");
          return;
        }
        setCampaign(owned);
        setCategory(owned.category);
      })
      .catch(() => toast.error("Unable to load campaign."))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id, router]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const preview = URL.createObjectURL(coverFile);
    setCoverPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [coverFile]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG, JPG, or WebP image.");
      event.target.value = "";
      setCoverFile(null);
      return;
    }
    setCoverFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campaign) return;

    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      let imageSrc = campaign.image_src ?? null;
      if (coverFile) {
        const upload = await campaignsApi.uploadCover(coverFile);
        imageSrc = upload.data.data.url;
      }

      await campaignsApi.update(campaign.id, {
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        category,
        institution: String(form.get("institution") || ""),
        location: String(form.get("location") || ""),
        goal_amount: Number(form.get("goal_amount") || 0),
        image_src: imageSrc,
      });
      toast.success("Campaign updated.");
      router.push("/donor#organized-drives");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Campaign update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !campaign) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <img src="/images/donate.png" alt="" />
          <span>Loading campaign editor...</span>
        </div>
      </div>
    );
  }

  const visibleCover = coverPreview || campaign.image_src || null;

  return (
    <div>
      <div className="start-hero" style={{ background: "var(--forest)", padding: "48px 40px" }}>
        <div className="container">
          <Link href="/donor#organized-drives" className="btn btn-outline btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,.28)", background: "rgba(255,255,255,.08)", marginBottom: 22 }}>
            <ArrowLeft size={14} /> Back to My Impact
          </Link>
          <div className="section-label" style={{ color: "var(--canopy-light)" }}>EDIT CAMPAIGN</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Update your campaign drive</h1>
          <p style={{ color: "rgba(255,255,255,.68)", fontSize: 16, maxWidth: 680 }}>
            Changes are saved instantly and recorded in the admin review log.
          </p>
        </div>
      </div>

      <div className="page-inner">
        <form onSubmit={handleSubmit} className="grid-2 start-campaign-form" style={{ alignItems: "start", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <section className="card">
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--forest)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={19} color="var(--canopy)" /> Campaign Details
              </h2>
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="small semi muted">Campaign title</span>
                  <input required name="title" defaultValue={campaign.title} className="form-input" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="small semi muted">Short story</span>
                  <textarea required name="description" defaultValue={campaign.description} className="form-input" rows={5} />
                </label>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className="small semi muted">Campaign cover image</span>
                  <div className="hover-border-canopy" style={{ padding: visibleCover ? 0 : 20, border: "1px dashed var(--border)", borderRadius: "var(--r-sm)", background: "rgba(255,255,255,.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", minHeight: 190, overflow: "hidden" }}>
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleCoverChange} style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer", zIndex: 2 }} />
                    {visibleCover ? (
                      <>
                        <img src={visibleCover} alt="Campaign cover" style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", left: 14, bottom: 14, zIndex: 3, padding: "8px 12px", borderRadius: 999, background: "rgba(255,253,248,.92)", fontSize: 12, fontWeight: 800, color: "var(--forest)", boxShadow: "0 10px 24px rgba(0,0,0,.12)" }}>
                          Click to replace cover
                        </div>
                      </>
                    ) : (
                      <>
                        <ImagePlus size={24} color="var(--canopy)" strokeWidth={1.8} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)", marginTop: 8 }}>Add campaign cover photo</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>PNG/JPG/WebP</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="form-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span className="small semi muted">Category</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-input">
                      {categories.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span className="small semi muted">Target amount</span>
                    <input required name="goal_amount" type="number" min="1" defaultValue={campaign.goal_amount} className="form-input" />
                  </label>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--forest)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={19} color="var(--canopy)" /> Recipient & Institution
              </h2>
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="small semi muted">Verified institution receiving funds</span>
                  <input required name="institution" defaultValue={campaign.institution} className="form-input" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="small semi muted">Location</span>
                  <div style={{ position: "relative" }}>
                    <MapPin size={15} style={{ position: "absolute", left: 12, top: 13, color: "var(--text3)" }} />
                    <input required name="location" defaultValue={campaign.location} className="form-input" style={{ paddingLeft: 36 }} />
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="start-campaign-side" style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 88 }}>
            <section className="card">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--forest)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="var(--canopy)" /> Organizer-only editing
              </h2>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
                Only the account that created this campaign can update its details. Admins will see who changed it, when it changed, and which fields were edited.
              </p>
            </section>

            <section className="card">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--forest)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Landmark size={18} color="var(--canopy)" /> Current Status
              </h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span className="badge badge-navy">{campaign.category}</span>
                <span className="badge badge-emerald">{campaign.status}</span>
              </div>
            </section>

            <div className="flex" style={{ flexDirection: "column", gap: 8 }}>
              <button type="submit" disabled={saving} className="btn btn-emerald btn-lg" style={{ justifyContent: "center", opacity: saving ? 0.72 : 1 }}>
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href="/donor#organized-drives" className="btn btn-outline" style={{ justifyContent: "center" }}>Cancel</Link>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
