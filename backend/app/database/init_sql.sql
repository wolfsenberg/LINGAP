-- Stored Procedure for Discover endpoint
-- Returns nearby campaigns with aggregated donation data and verification info
CREATE OR REPLACE FUNCTION sp_get_nearby_campaigns(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION,
    p_limit INT DEFAULT 50
) RETURNS TABLE (
    aid_request_id UUID,
    beneficiary_name TEXT,
    purpose TEXT,
    requested_amount NUMERIC,
    asset TEXT,
    status TEXT,
    distance_km DOUBLE PRECISION,
    donor_count INT,
    total_raised NUMERIC,
    funding_pct NUMERIC,
    is_verified BOOLEAN,
    credibility_score NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        b.name,
        ar.purpose,
        ar.requested_amount,
        ar.asset,
        ar.status::TEXT,
        haversine_km(p_lat, p_lng, b.latitude, b.longitude) AS distance_km,
        COUNT(d.id) AS donor_count,
        COALESCE(SUM(d.amount), 0) AS total_raised,
        CASE WHEN SUM(d.amount) = 0 THEN 0 ELSE (SUM(d.amount) / ar.requested_amount) * 100 END AS funding_pct,
        COALESCE(v.is_verified, FALSE) AS is_verified,
        COALESCE(v.credibility_score, 0) AS credibility_score
    FROM aid_request ar
    JOIN beneficiary b ON b.id = ar.beneficiary_id
    LEFT JOIN donation d ON d.aid_request_id = ar.id
    LEFT JOIN verification v ON v.aid_request_id = ar.id
    WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
      AND haversine_km(p_lat, p_lng, b.latitude, b.longitude) <= p_radius_km
    GROUP BY ar.id, b.name, v.id
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$;
