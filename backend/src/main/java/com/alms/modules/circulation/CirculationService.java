package com.alms.modules.circulation;

import com.alms.modules.circulation.dto.IssueLoanRequest;
import com.alms.modules.circulation.dto.KioskCheckoutRequest;
import com.alms.modules.circulation.dto.KioskResult;
import com.alms.modules.circulation.dto.LoanDto;
import com.alms.modules.circulation.dto.RenewLoanRequest;
import com.alms.modules.circulation.dto.ReturnLoanRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CirculationService {

    public LoanDto issueLoan(IssueLoanRequest request, String issuedBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Page<LoanDto> findLoans(String userId, Boolean active, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public LoanDto findLoanById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public LoanDto returnLoan(ReturnLoanRequest request, String returnedBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public LoanDto renewLoan(RenewLoanRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public KioskResult kioskCheckout(KioskCheckoutRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
